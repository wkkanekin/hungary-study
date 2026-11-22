"""Refresh Poland official pages using the shared verified change collector."""
from concurrent.futures import ThreadPoolExecutor
from datetime import date
import importlib.util
import json
from pathlib import Path
import requests
from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("germany_news", ROOT / "scripts/germany/official_news.py")
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)
DATA = ROOT / "poland/data"
TODAY = date.today()

def fetch(url):
    response = requests.get(url, timeout=(15, 30), headers={"User-Agent": "PolandStudyLab-OfficialNews/1.0"})
    response.raise_for_status()
    if len(response.content) > 12000000:
        raise ValueError("Unexpected response size")
    return response.text

def load(name, default):
    path = DATA / name
    return json.loads(path.read_text()) if path.exists() else default

def main():
    state = load("news-state.json", {})
    document = load("news.json", {"items": []})
    by_url = {item["url"]: item for item in document["items"]}
    sources = load("news-sources.json", [])
    statuses = []
    def collect(source):
        try:
            return news.collect(source, fetch, TODAY, state)
        except Exception as error:
            return [], {}, [str(error)], {"name": source["name"], "error": str(error)}
    with ThreadPoolExecutor(max_workers=4) as pool:
        for items, records, errors, status in pool.map(collect, sources):
            state.update(records)
            by_url.update({item["url"]: item for item in items})
            statuses.append(dict(status, errors=errors))
    document["items"] = sorted(by_url.values(), key=lambda item: item["date"], reverse=True)[:40]
    document["lastAttempt"] = TODAY.isoformat()
    if any("checkedOn" in status for status in statuses):
        document["checkedOn"] = TODAY.isoformat()
    news.write(DATA / "news.json", document)
    news.write(DATA / "news-state.json", state)
    news.write(DATA / "news-status.json", {"attemptedOn": TODAY.isoformat(), "sources": statuses})
    path = ROOT / "poland/index.html"
    soup = BeautifulSoup(path.read_text(), "html.parser")
    target = soup.select_one("#official-news-heading").parent
    listing = target.select_one(".polandNewsList")
    listing.clear()
    for item in document["items"][:8]:
        li = soup.new_tag("li")
        meta = soup.new_tag("p", attrs={"class": "roleLabel"})
        meta.string = item["date"] + "｜" + item.get("category", "公式情報")
        title = soup.new_tag("h4")
        anchor = soup.new_tag("a", href=item["url"])
        anchor.string = item["title"]
        title.append(anchor)
        li.extend([meta, title])
        if item.get("summary"):
            paragraph = soup.new_tag("p")
            paragraph.string = item["summary"]
            li.append(paragraph)
        listing.append(li)
    note = target.select_one(".mapSourceNote")
    note.string = "公式情報の確認日 " + document.get("checkedOn", "未確認")
    path.write_text(str(soup))

if __name__ == "__main__":
    main()
