import json
import math
import re
import sys
import html as html_lib
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import urlencode
from urllib.request import Request, urlopen


RANKINGS_URL = "https://www.numbeo.com/cost-of-living/rankings_current.jsp"
COMPARE_URL = "https://www.numbeo.com/cost-of-living/compare_cities.jsp"

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
    {
        "id": "fukuoka",
        "label_ja": "福岡",
        "city": "Fukuoka",
        "country": "Japan",
        "lookup": "Fukuoka, Japan",
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
    {
        "id": "gyor",
        "label_ja": "ジェール",
        "city": "Gyor",
        "country": "Hungary",
        "lookup": "Gyor, Hungary",
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


def parse_float(value: str) -> Optional[float]:
    try:
        return float(str(value).strip())
    except Exception:
        return None


def round1(value: float) -> float:
    return float(f"{value:.1f}")


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


def build_compare_url(city1: str, country1: str, city2: str, country2: str) -> str:
    query = urlencode(
        {
            "city1": city1,
            "city2": city2,
            "country1": country1,
            "country2": country2,
        }
    )
    return f"{COMPARE_URL}?{query}"


def parse_difference_sentence(text: str, metric_label: str, base_city: str, target_city: str) -> Tuple[float, str]:
    escaped_metric = re.escape(metric_label)
    escaped_base = re.escape(base_city)
    escaped_target = re.escape(target_city)

    pattern = re.compile(
        rf"{escaped_metric}\s+in\s+{escaped_base}\s+is\s+([0-9]+(?:\.[0-9]+)?)%\s+(higher|lower)\s+than\s+in\s+{escaped_target}",
        re.IGNORECASE,
    )

    match = pattern.search(text)
    if not match:
        raise ValueError(
            f"比較ページから '{metric_label} in {base_city} is ... than in {target_city}' を取得できませんでした"
        )

    percent = float(match.group(1))
    direction = match.group(2).lower()
    return percent, direction


def derive_target_from_base(base_value: float, percent: float, direction: str) -> float:
    ratio = percent / 100.0

    if direction == "higher":
        # base = target * (1 + ratio)
        return base_value / (1.0 + ratio)

    if direction == "lower":
        # base = target * (1 - ratio)
        if math.isclose(1.0 - ratio, 0.0):
            raise ValueError("lower 比率が 100% に近すぎて逆算できません")
        return base_value / (1.0 - ratio)

    raise ValueError(f"未知の方向: {direction}")


def extract_city_from_compare_page(
    compare_text: str,
    base_city_name: str,
    target_city_name: str,
    base_metrics: Dict[str, float],
) -> Dict[str, float]:
    cost_percent, cost_direction = parse_difference_sentence(
        compare_text,
        "Cost of Living",
        base_city_name,
        target_city_name,
    )
    rent_percent, rent_direction = parse_difference_sentence(
        compare_text,
        "Rent Prices",
        base_city_name,
        target_city_name,
    )
    restaurant_percent, restaurant_direction = parse_difference_sentence(
        compare_text,
        "Restaurant Prices",
        base_city_name,
        target_city_name,
    )

    return {
        "cost_of_living_index": round1(
            derive_target_from_base(
                base_metrics["cost_of_living_index"],
                cost_percent,
                cost_direction,
            )
        ),
        "rent_index": round1(
            derive_target_from_base(
                base_metrics["rent_index"],
                rent_percent,
                rent_direction,
            )
        ),
        "restaurant_price_index": round1(
            derive_target_from_base(
                base_metrics["restaurant_price_index"],
                restaurant_percent,
                restaurant_direction,
            )
        ),
        "cost_of_living_plus_rent_index": None,  # 今回はグラフ用途の3指標が主目的
        "groceries_index": None,
        "local_purchasing_power_index": None,
    }


def build_city_record(
    cfg: Dict[str, str],
    metrics: Dict[str, Optional[float]],
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
    compare_logs: List[Dict[str, Any]] = []

    # まずランキングページから Tokyo を基準として取得
    tokyo_cfg = next(cfg for cfg in CITY_CONFIGS if cfg["id"] == "tokyo")
    tokyo_metrics = extract_city_from_rankings(rankings_text, tokyo_cfg["lookup"])
    if not tokyo_metrics:
        raise RuntimeError("Tokyo の指標が rankings_current.jsp から取得できませんでした")

    # ランキングページから拾える都市はそのまま取得
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
            continue

        # 直接取れない都市は Tokyo 比較で補完
        compare_url = build_compare_url(
            city1=cfg["city"],
            country1=cfg["country"],
            city2="Tokyo",
            country2="Japan",
        )

        try:
            compare_html = fetch_url(compare_url)
            compare_text = normalize_space(html_to_text(compare_html))
            metrics = extract_city_from_compare_page(
                compare_text=compare_text,
                base_city_name="Tokyo",
                target_city_name=cfg["city"],
                base_metrics=tokyo_metrics,
            )

            records.append(
                build_city_record(
                    cfg=cfg,
                    metrics=metrics,
                    source_type="compare_cities",
                    source_url=compare_url,
                    note="Numbeo compare page から Tokyo 基準で逆算",
                )
            )
            compare_logs.append(
                {
                    "id": cfg["id"],
                    "url": compare_url,
                    "status": "ok",
                }
            )
        except Exception as exc:
            records.append(
                {
                    "id": cfg["id"],
                    "label_ja": cfg["label_ja"],
                    "city": cfg["city"],
                    "country": cfg["country"],
                    "lookup": cfg["lookup"],
                    "cost_of_living_index": None,
                    "rent_index": None,
                    "restaurant_price_index": None,
                    "source_type": "unavailable",
                    "source_url": compare_url,
                    "note": f"取得失敗: {exc}",
                }
            )
            compare_logs.append(
                {
                    "id": cfg["id"],
                    "url": compare_url,
                    "status": "error",
                    "error": str(exc),
                }
            )

    # 表示順
    order = [cfg["id"] for cfg in CITY_CONFIGS]
    order_map = {city_id: idx for idx, city_id in enumerate(order)}
    records.sort(key=lambda row: order_map.get(row["id"], 9999))

    payload: Dict[str, Any] = {
        "source": "Numbeo",
        "rankings_url": RANKINGS_URL,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "chart_metrics": [
            "cost_of_living_index",
            "rent_index",
            "restaurant_price_index",
        ],
        "cities": records,
        "meta": {
            "notes": [
                "rankings_current にある都市は直接取得",
                "rankings_current にない都市は compare_cities から Tokyo 基準で逆算",
                "Győr のように compare page 側でも取得できない場合は null のまま残す",
            ],
            "compare_logs": compare_logs,
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