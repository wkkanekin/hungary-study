"""Conservative official news collector; no AI, login, or API keys required."""
import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
import re
import sys
import time
from urllib.parse import urljoin, urlsplit, urlunsplit
from urllib.request import Request, urlopen
from bs4 import BeautifulSoup

USER_AGENT = "HungaryStudyLab-OfficialNews/1.0 (+https://hungarystudy.org/)"
MONTHS = {m.lower(): i for i, m in enumerate(
    "January February March April May June July August September October November December".split(), 1)}
TOPICS = re.compile(
    r"stipendium|scholarship|application|admission|tuition|dormitor|student report|"
    r"mentor network|residence permit|international students|foreign students|"
    r"statistics|statistical|applicants|annual report|higher education|"
    r"奨学金|学位取得|留学|留学生|在学生|大学生|応募|募集|締切|採用者|統計|学生数|"
    r"statisztik|külföldi hallgat|stipendium", re.I)
STATS = re.compile(r"statistics|statistical|applicants|number of.*students|annual report|"
                   r"統計|学生数|在学生数|応募.*採用|実績一覧|statisztik", re.I)
BLOCK = re.compile(r"高校生|高校等教員|日本語教育|外国人留学生.*日本|"
                   r"diaspora|peregrinum|discovereu|ceepus", re.I)


def clean(value):
    return re.sub(r"\s+", " ", value or "").strip()


def canonical(url):
    p = urlsplit(url)
    return urlunsplit((p.scheme.lower(), p.netloc.lower(), p.path, p.query, ""))


def safe_url(url, hosts):
    p = urlsplit(url)
    return p.scheme == "https" and p.hostname in hosts and not p.username and not p.password


def parse_date(text):
    text = clean(text)
    patterns = [
        (r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})", False),
        (r"令和(\d+)年(\d{1,2})月(\d{1,2})日", True),
    ]
    for pattern, era in patterns:
        m = re.search(pattern, text)
        if m:
            y, mo, d = map(int, m.groups())
            try:
                return date(y + 2018 if era else y, mo, d)
            except ValueError:
                return None
    m = re.search(r"(" + "|".join(MONTHS) + r")\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d{2})", text, re.I)
    if m:
        try:
            return date(int(m[3]), MONTHS[m[1].lower()], int(m[2]))
        except ValueError:
            pass
    return None


def node_date(node):
    for el in node.select('time, [itemprop="datePublished"], [itemprop="dateCreated"], .card-timestamp, .timestamp, .created, .date'):
        found = parse_date(el.get("datetime") or el.get("content") or el.get_text(" ", strip=True))
        if found:
            return found
    return None


def fetch(url, hosts):
    if not safe_url(url, hosts):
        raise ValueError("URL outside official allowlist")
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": USER_AGENT}), timeout=20) as response:
                if not safe_url(response.url, hosts):
                    raise ValueError("Redirect outside official allowlist")
                if "html" not in response.headers.get("Content-Type", "").lower():
                    raise ValueError("Expected HTML")
                raw = response.read(3_000_001)
                if len(raw) > 3_000_000:
                    raise ValueError("HTML too large")
                return BeautifulSoup(raw, "html.parser")
        except Exception:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)


def candidates(soup, source):
    """Only source-specific news containers; never navigation/footer links."""
    items = {}
    for card in soup.select(source["selector"]):
        title_node = card.select_one(source.get("title_selector", "h1,h2,h3,h4,h5,.title"))
        anchor = card if source.get("link_selector", "a[href]") is None else card.select_one(source.get("link_selector", "a[href]"))
        if not anchor:
            continue
        title = clean(title_node.get_text(" ", strip=True) if title_node else anchor.get_text(" ", strip=True))
        url = canonical(urljoin(source["url"], anchor.get("href", "")))
        if not safe_url(url, source["hosts"]) or not title or not TOPICS.search(title) or BLOCK.search(title):
            continue
        if source.get("link_pattern") and not re.search(source["link_pattern"], url):
            continue
        items[url] = {"url": url, "title": title, "date": node_date(card)}
    # MOFA has separate dt/dd entries rather than article cards.
    if source.get("kind") == "mofa":
        for dd in soup.select("dl.linklist_date dd"):
            a = dd.select_one("a[href]")
            if not a:
                continue
            title = clean(a.get_text(" ", strip=True))
            url = canonical(urljoin(source["url"], a["href"]))
            dt = dd.find_previous_sibling("dt")
            if safe_url(url, source["hosts"]) and TOPICS.search(title) and not BLOCK.search(title):
                items[url] = {"url": url, "title": title, "date": parse_date(dt.get_text()) if dt else None}
    return list(items.values())


def article_info(soup):
    # Metadata, not a random deadline or date from the article body.
    published = modified = None
    for meta in soup.select("meta[property],meta[name]"):
        key = meta.get("property") or meta.get("name")
        if key in ("article:published_time", "date", "pubdate"):
            published = published or parse_date(meta.get("content", ""))
        if key in ("article:modified_time", "last-modified"):
            modified = modified or parse_date(meta.get("content", ""))
    for script in soup.select('script[type="application/ld+json"]'):
        try:
            data = json.loads(script.string or script.get_text())
        except (ValueError, TypeError):
            continue
        def visit(obj):
            nonlocal published, modified
            if isinstance(obj, list):
                for value in obj:
                    visit(value)
            elif isinstance(obj, dict):
                kinds = obj.get("@type", [])
                if isinstance(kinds, str):
                    kinds = [kinds]
                if any(k in ("Article", "NewsArticle", "BlogPosting", "WebPage") for k in kinds):
                    published = published or parse_date(obj.get("datePublished", ""))
                    modified = modified or parse_date(obj.get("dateModified", ""))
                for value in obj.values():
                    if isinstance(value, (list, dict)):
                        visit(value)
        visit(data)
    main = soup.select_one("article") or soup.select_one("main") or soup.select_one("#main") or soup.select_one(".content") or soup.body
    if main is None:
        raise ValueError("Missing article body")
    published = published or node_date(main)
    # Exclude site chrome and dynamic counters from update detection.
    for tag in main.select("script,style,nav,footer,header,.related,.share,.comments"):
        tag.decompose()
    text = clean(main.get_text(" ", strip=True))
    if len(text) < 50:
        raise ValueError("Article body too short")
    assets = sorted({a.get("href", "") for a in main.select("a[href]")} |
                    {a.get("src", "") for a in main.select("img[src]")})
    fingerprint = hashlib.sha256((text + "\n" + "\n".join(assets)).encode()).hexdigest()
    return published, modified, text, fingerprint


def display_title(source, title, updated=False):
    title = clean(title)
    if source.get("supplement") and "学位取得" not in title:
        prefix = "【日本の大学等に在籍する方向け】"
    elif STATS.search(title):
        prefix = "【留学・奨学金の統計】"
    else:
        prefix = "【公的機関のお知らせ】"
    suffix = "（内容変更を検知・詳細は公式へ）" if updated else "（詳細は公式へ）"
    # Keep the actual source heading and its year; never invent a Japanese translation.
    return f"{prefix}{source['name']}：{title[:180]}{suffix}"


def collect_source(source, today, old_state, old_items, blocked, dry_run=False):
    changes, new_state, errors = [], {}, []
    soup = fetch(source["url"], source["hosts"])
    if source.get("kind") == "watch":
        heading = soup.select_one("h1") or soup.select_one("h2") or soup.title
        title = clean(heading.get_text(" ", strip=True))
        if source.get("expected_heading") and not re.search(source["expected_heading"], title, re.I):
            raise ValueError("Watched page heading changed or redirected")
        entries = [{"url": canonical(source["url"]), "title": source.get("title", title), "date": None}]
    else:
        entries = candidates(soup, source)
        # Empty date/title selectors must be visible as a failure, not silently accepted.
        if not soup.select(source["selector"]) and source.get("kind") != "mofa":
            raise ValueError("News selector matched no entries")
    for entry in entries[:30]:
        url, title = entry["url"], entry["title"]
        previous = old_state.get(url)
        listing_date = entry["date"]
        # Baseline old news without fetching the entire history.
        if not previous and listing_date and listing_date < today - timedelta(days=7):
            new_state[url] = {"date": listing_date.isoformat(), "baseline": True}
            continue
        try:
            page = soup if source.get("kind") == "watch" else fetch(url, source["hosts"])
            published, modified, body, digest = article_info(page)
            published = published or listing_date
            event_date = modified if modified and (not published or modified >= published) else published
            record = {"fingerprint": digest, "date": event_date.isoformat() if event_date else None}
            new_state[url] = record
            # Undated watched statistics establish a baseline first. Later a verified
            # content change can be reported honestly as a detected update.
            changed = bool(previous and previous.get("fingerprint") and previous["fingerprint"] != digest)
            recent = bool(event_date and today - timedelta(days=7) <= event_date <= today)
            if event_date and event_date > today:
                continue
            if source.get("kind") == "watch":
                publish = changed
            else:
                # A changed body alone cannot make a past scholarship call current.
                publish = recent and (url not in old_items or changed)
            if not publish or url in blocked:
                continue
            # A scholarship call carrying only past target years isn't current.
            years = [int(y) for y in re.findall(r"\b(20\d{2})\b", title)]
            if re.search(r"募集|application|apply|call for", title, re.I) and years and max(years) < today.year:
                continue
            stamp = modified if changed and modified and modified <= today else (today if changed else event_date)
            changes.append({
                "enabled": True, "type": "お知らせ",
                "publishedAt": stamp.isoformat(), "title": display_title(source, title, changed),
                "url": url, "source": source["name"], "sourceTitle": title,
                "sourcePublishedAt": published.isoformat() if published else None,
                "sourceUpdatedAt": modified.isoformat() if modified else None,
                "detectedAt": today.isoformat(),
                "dateBasis": "detected_content_change" if changed and not modified else "official",
                "priority": 2 if STATS.search(title) else 1,
            })
        except Exception as exc:
            errors.append(f"{source['name']} article {url}: {type(exc).__name__}: {exc}")
    return changes, new_state, errors


def load_json(path, default):
    if not path.exists():
        return default
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path, data):
    text = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
    if path.exists() and path.read_text(encoding="utf-8") == text:
        return
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(text, encoding="utf-8")
    temp.replace(path)


def run(root, today, dry_run=False):
    config = load_json(root / "official-news-sources.json", {})
    state_path = root / "scripts/official-news-state.json"
    old_state = load_json(state_path, {})
    items = load_json(root / "official-news.json", [])
    old_items = {canonical(x["url"]): x for x in items}
    manual = load_json(root / "announcements.json", [])
    blocked = {canonical(x["url"]) for x in manual if x.get("url")}
    blocked.update(config.get("blocked_urls", []))
    errors, successes = [], 0
    def worker(source):
        try:
            return source, collect_source(source, today, old_state, old_items, blocked)
        except Exception as exc:
            return source, ([], {}, [f"{source['name']}: {type(exc).__name__}: {exc}"])
    with ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(worker, config["sources"]))
    for source, (changes, records, source_errors) in results:
        if records or not source_errors:
            successes += 1
        old_state.update(records)
        for entry in changes:
            old_items[entry["url"]] = entry
        errors.extend(source_errors)
    ordered = sorted(old_items.values(), key=lambda x: (x["publishedAt"], x.get("priority", 1), x["url"]), reverse=True)[:100]
    if not dry_run:
        write_json(root / "official-news.json", ordered)
        write_json(state_path, old_state)
    report = {"checkedAt": today.isoformat(), "sourcesSuccessful": successes,
              "sourcesTotal": len(config["sources"]), "publishedItems": len(ordered),
              "errors": errors, "dryRun": dry_run}
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not dry_run:
        write_json(root / "scripts/official-news-status.json", report)
    # Partial failures preserve all previous items and are visible in Actions.
    for error in errors:
        print("::warning::" + error.replace("\n", " "), file=sys.stderr)
    return 1 if successes == 0 else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--today", type=date.fromisoformat)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    today = args.today or datetime.now(timezone(timedelta(hours=9))).date()
    sys.exit(run(args.root, today, args.dry_run))
