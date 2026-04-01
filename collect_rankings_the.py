import json
import re
import urllib.request
from datetime import datetime, timezone
from html import unescape


SUBJECTS = [
    {
        "key": "arts-humanities",
        "label_en": "Arts and Humanities",
        "label_ja": "芸術・人文科学"
    },
    {
        "key": "business-economics",
        "label_en": "Business and Economics",
        "label_ja": "ビジネス・経済"
    },
    {
        "key": "clinical-health",
        "label_en": "Clinical and Health",
        "label_ja": "臨床・健康"
    },
    {
        "key": "computer-science",
        "label_en": "Computer Science",
        "label_ja": "コンピューターサイエンス"
    },
    {
        "key": "education-studies",
        "label_en": "Education Studies",
        "label_ja": "教育"
    },
    {
        "key": "engineering",
        "label_en": "Engineering",
        "label_ja": "工学"
    },
    {
        "key": "law",
        "label_en": "Law",
        "label_ja": "法学"
    },
    {
        "key": "life-sciences",
        "label_en": "Life Sciences",
        "label_ja": "生命科学"
    },
    {
        "key": "physical-sciences",
        "label_en": "Physical Sciences",
        "label_ja": "物理科学"
    },
    {
        "key": "psychology",
        "label_en": "Psychology",
        "label_ja": "心理学"
    },
    {
        "key": "social-sciences",
        "label_en": "Social Sciences",
        "label_ja": "社会科学"
    }
]

UNIVERSITIES = [
    {
        "name": "Budapest University of Technology and Economics",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/budapest-university-technology-and-economics"
    },
    {
        "name": "Corvinus University of Budapest",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/corvinus-university-budapest"
    },
    {
        "name": "Eötvös Loránd University",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/eotvos-lorand-university"
    },
    {
        "name": "Semmelweis University",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/semmelweis-university"
    },
    {
        "name": "Hungarian University of Fine Arts",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Hungarian University of Sports Science",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Hungarian Dance University",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Liszt Ferenc Academy of Music",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Moholy-Nagy University of Art and Design",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Óbuda University",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/obuda-university"
    },
    {
        "name": "Pázmány Péter Catholic University",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Károli Gáspár University of the Reformed Church in Hungary",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Ludovika University of Public Service",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "John Wesley Theological College",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Dharma Gate Buddhist College",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "Budapest Metropolitan University",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/budapest-metropolitan-university"
    },
    {
        "name": "Budapest University of Economics and Business",
        "city": "Budapest",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/budapest-business-school"
    },
    {
        "name": "University of Veterinary Medicine Budapest",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "MFA Balassi Preparatory Programme",
        "city": "Budapest",
        "the_url": None
    },
    {
        "name": "University of Debrecen",
        "city": "Debrecen",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/university-debrecen"
    },
    {
        "name": "University of Szeged",
        "city": "Szeged",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/university-szeged"
    },
    {
        "name": "University of Pécs",
        "city": "Pécs",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/university-pecs"
    },
    {
        "name": "University of Miskolc",
        "city": "Miskolc",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/university-miskolc"
    },
    {
        "name": "University of Sopron",
        "city": "Sopron",
        "the_url": None
    },
    {
        "name": "Széchenyi István University",
        "city": "Győr",
        "the_url": None
    },
    {
        "name": "University of Pannonia",
        "city": "Veszprém",
        "the_url": None
    },
    {
        "name": "University of Nyíregyháza",
        "city": "Nyíregyháza",
        "the_url": None
    },
    {
        "name": "University of Dunaújváros",
        "city": "Dunaújváros",
        "the_url": None
    },
    {
        "name": "John von Neumann University",
        "city": "Kecskemét",
        "the_url": None
    },
    {
        "name": "Hungarian University of Agriculture and Life Sciences (MATE)",
        "city": "Gödöllő",
        "the_url": "https://www.timeshighereducation.com/world-university-rankings/hungarian-university-agriculture-and-life-sciences"
    },
    {
        "name": "Eszterházy Károly Catholic University",
        "city": "Eger",
        "the_url": None
    },
    {
        "name": "University of Tokaj",
        "city": "Sárospatak",
        "the_url": None
    },
    {
        "name": "Apor Vilmos Catholic College",
        "city": "Vác",
        "the_url": None
    },
    {
        "name": "Episcopal Theological College of Pécs",
        "city": "Pécs",
        "the_url": None
    },
    {
        "name": "Eötvös József College",
        "city": "Baja",
        "the_url": None
    },
    {
        "name": "Kodály Institute",
        "city": "Kecskemét",
        "the_url": None
    },
    {
        "name": "International Business School Budapest",
        "city": "Budapest",
        "the_url": None
    }
]


def fetch_html(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            )
        }
    )
    with urllib.request.urlopen(req, timeout=60) as res:
        return res.read().decode("utf-8", errors="ignore")


def strip_html(html: str) -> str:
    text = unescape(html or "")
    text = re.sub(r"<script[\s\S]*?</script>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.IGNORECASE)
    text = re.sub(r"<[^>]+>", " ", text)
    text = text.replace("\u00a0", " ")
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_rank(value: str) -> str:
    s = str(value or "").strip()
    s = unescape(s)
    s = s.replace("&nbsp;", " ")
    s = s.replace("−", "-")
    s = s.replace("–", "-")
    s = s.replace("—", "-")
    s = re.sub(r"\s+", "", s)

    if not s:
        return "—"

    if s.upper() in {"N/A", "NA", "NOTRANKED", "UNRANKED"}:
        return "—"

    if re.fullmatch(r"\d+\+", s):
        return s

    if re.fullmatch(r"\d+-\d+", s):
        return s.replace("-", "–")

    if re.fullmatch(r"\d+", s):
        return s

    m_range = re.search(r"(\d+)\s*-\s*(\d+)", s)
    if m_range:
        return f"{m_range.group(1)}–{m_range.group(2)}"

    m_plus = re.search(r"(\d+)\s*\+", s)
    if m_plus:
        return f"{m_plus.group(1)}+"

    m_single = re.search(r"\b(\d+)\b", s)
    if m_single:
        return m_single.group(1)

    return "—"


def rank_sort_key_from_value(rank: str) -> tuple[int, int]:
    value = str(rank or "—").strip()

    if value in {"—", "", "N/A"}:
        return (999999, 999999)

    normalized = value.replace("–", "-").replace("—", "-")

    if normalized.endswith("+"):
        try:
            n = int(normalized[:-1])
            return (n, 999999)
        except Exception:
            return (999999, 999999)

    if "-" in normalized:
        left, right = normalized.split("-", 1)
        try:
            return (int(left), int(right))
        except Exception:
            return (999998, 999998)

    try:
        n = int(normalized)
        return (n, n)
    except Exception:
        return (999997, 999997)


def rank_sort_key(item: dict) -> tuple[int, int]:
    return rank_sort_key_from_value(str(item.get("rank", "—")))


def extract_overall_rank(html: str) -> str:
    patterns = [
        r'"rank":"([^"]+)"',
        r'"current_rank":"([^"]+)"',
        r'"overall_rank":"([^"]+)"',
        r'"ranked":"([^"]+)"',
    ]

    for pattern in patterns:
        match = re.search(pattern, html, flags=re.IGNORECASE)
        if match:
            rank = normalize_rank(match.group(1))
            if rank != "—":
                return rank

    text = strip_html(html)

    fallback_patterns = [
        r"World University Rankings\s*(?:20\d{2})?\s*([0-9]{1,4}(?:\s*[–-]\s*[0-9]{1,4}|\s*\+)?)",
        r"overall rank\s*([0-9]{1,4}(?:\s*[–-]\s*[0-9]{1,4}|\s*\+)?)",
    ]

    for pattern in fallback_patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            rank = normalize_rank(match.group(1))
            if rank != "—":
                return rank

    return "—"


def extract_subject_rank_from_text(text: str, label_en: str) -> str:
    escaped = re.escape(label_en)

    patterns = [
        rf"{escaped}\s*(?:20\d{{2}})?\s*([0-9]{{1,4}}(?:\s*[–-]\s*[0-9]{{1,4}}|\s*\+)?)",
        rf"{escaped}[^0-9]{{0,80}}([0-9]{{1,4}}(?:\s*[–-]\s*[0-9]{{1,4}}|\s*\+)?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            rank = normalize_rank(match.group(1))
            if rank != "—":
                return rank

    return "—"


def extract_subject_rank_from_html(html: str, label_en: str, key: str) -> str:
    escaped_label = re.escape(label_en)
    escaped_key = re.escape(key)

    patterns = [
        rf'"name":"{escaped_label}"[\s\S]{{0,250}}?"rank":"([^"]+)"',
        rf'"subject":"{escaped_label}"[\s\S]{{0,250}}?"rank":"([^"]+)"',
        rf'"slug":"{escaped_key}"[\s\S]{{0,250}}?"rank":"([^"]+)"',
        rf'"ranking":"([^"]+)"[\s\S]{{0,180}}?"name":"{escaped_label}"',
    ]

    for pattern in patterns:
        match = re.search(pattern, html, flags=re.IGNORECASE)
        if match:
            rank = normalize_rank(match.group(1))
            if rank != "—":
                return rank

    return "—"


def build_empty_subject_rows() -> dict:
    return {
        subject["key"]: {
            "rank": "—",
            "url": ""
        }
        for subject in SUBJECTS
    }


def extract_all_subject_ranks(html: str, base_url: str) -> dict:
    text = strip_html(html)
    subjects = build_empty_subject_rows()

    for subject in SUBJECTS:
        key = subject["key"]
        label_en = subject["label_en"]

        rank = extract_subject_rank_from_html(html, label_en, key)
        if rank == "—":
            rank = extract_subject_rank_from_text(text, label_en)

        subjects[key] = {
            "rank": rank,
            "url": base_url if rank != "—" else ""
        }

    return subjects


def build_results() -> list[dict]:
    results = []

    for uni in UNIVERSITIES:
        name = uni["name"]
        city = uni["city"]
        the_url = uni["the_url"]

        if not the_url:
            results.append({
                "university": name,
                "city": city,
                "rank": "—",
                "url": "",
                "listed_in_the": False,
                "subject_ranks": build_empty_subject_rows()
            })
            continue

        try:
            html = fetch_html(the_url)
            overall_rank = extract_overall_rank(html)
            subject_ranks = extract_all_subject_ranks(html, the_url)

            results.append({
                "university": name,
                "city": city,
                "rank": overall_rank if overall_rank else "—",
                "url": the_url,
                "listed_in_the": overall_rank not in {"—", "N/A", ""},
                "subject_ranks": subject_ranks
            })
        except Exception:
            results.append({
                "university": name,
                "city": city,
                "rank": "—",
                "url": the_url,
                "listed_in_the": False,
                "subject_ranks": build_empty_subject_rows()
            })

    results.sort(key=rank_sort_key)
    return results


def build_subject_rankings(results: list[dict]) -> dict:
    subjects_output = []

    for subject in SUBJECTS:
        key = subject["key"]
        label_en = subject["label_en"]
        label_ja = subject["label_ja"]

        universities = []
        for row in results:
            subject_data = row.get("subject_ranks", {}).get(key, {})
            rank = str(subject_data.get("rank", "—")).strip()
            url = str(subject_data.get("url", "")).strip()

            if rank == "—":
                continue

            universities.append({
                "university": row.get("university", ""),
                "city": row.get("city", ""),
                "rank": rank,
                "url": url
            })

        universities.sort(key=lambda item: rank_sort_key_from_value(item.get("rank", "—")))

        subjects_output.append({
            "key": key,
            "label_en": label_en,
            "label_ja": label_ja,
            "count": len(universities),
            "universities": universities
        })

    return {
        "updated": datetime.now(timezone.utc).isoformat(),
        "subjects": subjects_output
    }


def main() -> None:
    results = build_results()

    overall_output = {
        "source": "Times Higher Education",
        "updated": datetime.now(timezone.utc).isoformat(),
        "count": len(results),
        "universities": [
            {
                "university": row["university"],
                "city": row["city"],
                "rank": row["rank"],
                "url": row["url"],
                "listed_in_the": row["listed_in_the"]
            }
            for row in results
        ]
    }

    with open("rankings.json", "w", encoding="utf-8") as f:
        json.dump(overall_output, f, ensure_ascii=False, indent=2)

    subject_output = build_subject_rankings(results)

    with open("subject-rankings.json", "w", encoding="utf-8") as f:
        json.dump(subject_output, f, ensure_ascii=False, indent=2)

    print("rankings.json generated")
    print("subject-rankings.json generated")


if __name__ == "__main__":
    main()