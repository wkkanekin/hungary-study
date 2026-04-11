import json
import re
import sys
import html as html_lib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.request import Request, urlopen


RANKINGS_URL = "https://www.numbeo.com/cost-of-living/rankings_current.jsp"
USER_AGENT = "Mozilla/5.0 (compatible; hungarystudy-bot/1.0; +https://hungarystudy.org)"


CITY_CONFIGS: List[Dict[str, str]] = [
    # 日本
    {
        "id": "tokyo",
        "label_ja": "東京",
        "city": "Tokyo",
        "country": "Japan",
        "lookup": "Tokyo, Japan",
    },
    {
        "id": "osaka",
        "label_ja": "大阪",
        "city": "Osaka",
        "country": "Japan",
        "lookup": "Osaka, Japan",
    },

    # ハンガリー
    {
        "id": "budapest",
        "label_ja": "ブダペスト",
        "city": "Budapest",
        "country": "Hungary",
        "lookup": "Budapest, Hungary",
    },
    {
        "id": "pecs",
        "label_ja": "ペーチ",
        "city": "Pecs",
        "country": "Hungary",
        "lookup": "Pecs, Hungary",
    },
    {
        "id": "debrecen",
        "label_ja": "デブレツェン",
        "city": "Debrecen",
        "country": "Hungary",
        "lookup": "Debrecen, Hungary",
    },
    {
        "id": "szeged",
        "label_ja": "セゲド",
        "city": "Szeged",
        "country": "Hungary",
        "lookup": "Szeged, Hungary",
    },
]


def fetch_url(url: str) -> str:
    req = Request(
        url,
        headers={"User-Agent": USER_AGENT},
        method="GET",
    )
    with urlopen(req, timeout=60) as res:
        raw = res.read()
    return raw.decode("utf-8", errors="ignore")


def html_to_text(html: str) -> str:
    text = html
    text = re.sub(r"(?is)<script.*?>.*?</script>", " ", text)
    text = re.sub(r"(?is)<style.*?>.*?</style>", " ", text)
    text = re.sub(r"(?is)<!--.*?-->", " ", text)
    text = re.sub(r"(?i)<br\s*/?>", "\n", text)
    text = re.sub(r"(?i)</p\s*>", "\n", text)
    text = re.sub(r"(?i)</div\s*>", "\n", text)
    text = re.sub(r"(?i)</tr\s*>", "\n", text)
    text = re.sub(r"(?is)<[^>]+>", " ", text)
    text = html_lib.unescape(text)
    text = text.replace("\u00a0", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n+", "\n", text)
    return text.strip()


def normalize_space(value: str) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def build_rankings_city_regex(city_lookup: str) -> re.Pattern[str]:
    city_part = re.escape(city_lookup)
    number = r"([0-9]+(?:\.[0-9]+)?)"
    pattern = (
        city_part
        + r"\s+"
        + number
        + r"\s+"
        + number
        + r"\s+"
        + number
        + r"\s+"
        + number
        + r"\s+"
        + number
        + r"\s+"
        + number
    )
    return re.compile(pattern, re.IGNORECASE)


def extract_city_from_rankings(rankings_text: str, city_lookup: str) -> Optional[Dict[str, float]]:
    pattern = build_rankings_city_regex(city_lookup)
    match = pattern.search(rankings_text)
    if not match:
        return None

    return {
        "cost_of_living_index": float(match.group(1)),
        "rent_index": float(match.group(2)),
        "cost_of_living_plus_rent_index": float(match.group(3)),
        "groceries_index": float(match.group(4)),
        "restaurant_price_index": float(match.group(5)),
        "local_purchasing_power_index": float(match.group(6)),
    }


def build_city_record(
    cfg: Dict[str, str],
    metrics: Dict[str, float],
    source_type: str,
    source_url: str,
    note: str = "",
) -> Dict[str, Any]:
    return {
        "id": cfg["id"],
        "label_ja": cfg["label_ja"],
        "city": cfg["city"],
        "country": cfg["country"],
        "lookup": cfg["lookup"],
        "cost_of_living_index": metrics.get("cost_of_living_index"),
        "rent_index": metrics.get("rent_index"),
        "restaurant_price_index": metrics.get("restaurant_price_index"),
        "source_type": source_type,
        "source_url": source_url,
        "note": note,
    }


def build_payload() -> Dict[str, Any]:
    rankings_html = fetch_url(RANKINGS_URL)
    rankings_text = normalize_space(html_to_text(rankings_html))

    records: List[Dict[str, Any]] = []
    missing_cities: List[Dict[str, str]] = []

    for cfg in CITY_CONFIGS:
        direct_metrics = extract_city_from_rankings(rankings_text, cfg["lookup"])
        if direct_metrics:
            records.append(
                build_city_record(
                    cfg=cfg,
                    metrics=direct_metrics,
                    source_type="rankings_current",
                    source_url=RANKINGS_URL,
                    note="Numbeo current rankings から直接取得",
                )
            )
        else:
            missing_cities.append(
                {
                    "id": cfg["id"],
                    "lookup": cfg["lookup"],
                }
            )

    if missing_cities:
        missing_text = ", ".join(item["lookup"] for item in missing_cities)
        raise RuntimeError(
            f"rankings_current.jsp から取得できない都市があります: {missing_text}"
        )

    order = [cfg["id"] for cfg in CITY_CONFIGS]
    order_map = {city_id: idx for idx, city_id in enumerate(order)}
    records.sort(key=lambda row: order_map.get(row["id"], 9999))

    payload: Dict[str, Any] = {
        "source": "Numbeo",
        "rankings_url": RANKINGS_URL,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "index_base": "New York = 100",
        "chart_metrics": [
            "cost_of_living_index",
            "rent_index",
            "restaurant_price_index",
        ],
        "cities": records,
        "meta": {
            "notes": [
                "対象は東京・大阪・ブダペスト・ペーチ・デブレツェン・セゲド",
                "すべて rankings_current.jsp から直接取得",
                "指数の基準は New York = 100",
            ],
        },
    }

    return payload


def write_json(payload: Dict[str, Any], out_path: str) -> None:
    Path(out_path).write_text(
        json.dumps(payload, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "cost_compare_numbeo.json"
    payload = build_payload()
    write_json(payload, out_path)
    print(f"Wrote: {out_path}")


if __name__ == "__main__":
    main()