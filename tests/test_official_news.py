import importlib.util
import json
from datetime import date
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from bs4 import BeautifulSoup

SPEC = importlib.util.spec_from_file_location("official_news", Path(__file__).resolve().parents[1] / "scripts/official_news.py")
news = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(news)
SOURCE = {"name": "SH", "url": "https://stipendiumhungaricum.hu/news/",
          "hosts": ["stipendiumhungaricum.hu"], "selector": "article",
          "title_selector": "h2"}
URL = "https://stipendiumhungaricum.hu/news/call/"


def listing(day="2026-10-05", title="2027/2028 Stipendium Hungaricum application is open"):
    return BeautifulSoup(f'<nav><a href="https://evil.example/">scholarship</a></nav><article><h2>{title}</h2><time datetime="{day}"></time><a href="{URL}">More</a></article>', "html.parser")


def article(day="2026-10-05", words="Scholarship application details are on this official page. " * 4):
    return BeautifulSoup(f'<meta property="article:published_time" content="{day}"><article><h1>Official call</h1><p>{words}</p></article>', "html.parser")


class NewsTests(unittest.TestCase):
    def collect(self, page=None, state=None, items=None, blocked=None, listing_page=None):
        with patch.object(news, "fetch", side_effect=[listing_page or listing(), page or article()]):
            return news.collect_source(SOURCE, date(2026, 10, 5), state or {}, items or {}, blocked or set())

    def test_dates_not_deadlines(self):
        self.assertEqual(news.parse_date("January 19th, 2026"), date(2026, 1, 19))
        self.assertEqual(news.parse_date("令和8年10月1日"), date(2026, 10, 1))
        self.assertIsNone(news.parse_date("2026-02-30"))
        parsed = news.article_info(BeautifulSoup("<article><p>" + "Deadline 2027-01-15. " * 10 + "</p></article>", "html.parser"))
        self.assertIsNone(parsed[0])

    def test_allowlist_and_navigation(self):
        self.assertFalse(news.safe_url("https://stipendiumhungaricum.hu.evil.example/news/", SOURCE["hosts"]))
        self.assertFalse(news.safe_url("javascript:alert(1)", SOURCE["hosts"]))
        self.assertEqual(len(news.candidates(listing(), SOURCE)), 1)

    def test_current_call_and_duplicate(self):
        changes, state, errors = self.collect()
        self.assertEqual(len(changes), 1)
        self.assertIn("2027/2028", changes[0]["title"])
        self.assertFalse(errors)
        changes2, _, _ = self.collect(state=state, items={URL: changes[0]})
        self.assertFalse(changes2)

    def test_future_and_unknown_date(self):
        for day in ["2026-10-06", ""]:
            changes, _, _ = self.collect(page=article(day), listing_page=listing(day))
            self.assertFalse(changes)

    def test_manual_dedup(self):
        self.assertFalse(self.collect(blocked={URL})[0])

    def test_japanese_application_notice(self):
        source = dict(SOURCE, supplement=True)
        card = listing(title="【大学生等対象】2027年度（第19期）応募への準備お役立ち情報")
        self.assertEqual(len(news.candidates(card, source)), 1)
        self.assertIn("日本の大学等に在籍", news.display_title(source, "2027年度募集"))
        self.assertNotIn("在籍する方向け", news.display_title(source, "2027年度大学院学位取得型募集"))

    def test_changed_recent_article(self):
        changes, state, _ = self.collect()
        updated = self.collect(page=article(words="Updated eligibility rules. " * 10), state=state, items={URL: changes[0]})[0]
        self.assertEqual(len(updated), 1)
        self.assertIn("内容変更", updated[0]["title"])

    def test_old_call_not_revived(self):
        changes = self.collect(page=article("2025-10-05"), listing_page=listing("2025-10-05"),
                               state={URL: {"fingerprint": "old"}}, items={URL: {}})[0]
        self.assertFalse(changes)

    def test_statistics_baseline_and_detected_date(self):
        watch = dict(SOURCE, kind="watch", title="SH統計資料ページの更新")
        with patch.object(news, "fetch", return_value=article("", "Statistics of international students. " * 8)):
            changes, state, _ = news.collect_source(watch, date(2026, 10, 5), {}, {}, set())
        self.assertFalse(changes)
        with patch.object(news, "fetch", return_value=article("", "New statistics of international students. " * 8)):
            changes, _, _ = news.collect_source(watch, date(2026, 10, 6), state, {}, set())
        self.assertEqual(changes[0]["dateBasis"], "detected_content_change")
        self.assertIsNone(changes[0]["sourcePublishedAt"])

    def test_failure_preserves_news(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            news.write_json(root / "official-news-sources.json", {"sources": [SOURCE]})
            item = {"enabled": True, "url": URL, "title": "Existing", "publishedAt": "2026-10-01"}
            news.write_json(root / "official-news.json", [item])
            with patch.object(news, "fetch", side_effect=OSError("502")):
                self.assertEqual(news.run(root, date(2026, 10, 5)), 1)
            self.assertEqual(json.loads((root / "official-news.json").read_text()), [item])


if __name__ == "__main__":
    unittest.main()
