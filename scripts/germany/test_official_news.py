import unittest,tempfile,json
from pathlib import Path
from datetime import date
from unittest.mock import Mock
from official_news import eligible_jasso,daad_items,collect
from bs4 import BeautifulSoup
class OfficialNews(unittest.TestCase):
 def test_jasso_target_and_course(self):
  def page(country,course):return BeautifulSoup(f'<table><tr><th>国・地域</th><td>{country}</td></tr><tr><th>留学先校の課程</th><td>{course}</td></tr></table>','html.parser')
  self.assertTrue(eligible_jasso(page('ドイツ','大学院')))
  self.assertTrue(eligible_jasso(page('限定なし','大学学部')))
  self.assertFalse(eligible_jasso(page('韓国','大学院')))
  self.assertFalse(eligible_jasso(page('ドイツ','語学学校')))
 def test_daad_fallback(self):
  source={'name':'DAAD','kind':'daad','url':'https://www.daad.jp/ja/news/','alternatives':['https://www.daad.jp/ja/feed/']}
  rss='<rss><channel><item><title>2027年度奨学金</title><link>https://www.daad.jp/ja/2026/10/05/test/</link></item><item><title>2027年度奨学金</title><link>https://evil.example/ja/2026/10/05/test/</link></item></channel></rss>'
  result=collect(source,Mock(side_effect=[RuntimeError('403'),rss]),date(2026,10,12),{})
  self.assertEqual(len(result[0]),1);self.assertEqual(result[3]['endpoint'],source['alternatives'][0])
 def test_watch_baseline_and_change(self):
  source={'name':'University','kind':'watch','url':'https://example.edu/scholarships','expected_heading':'Scholarships','title':'Scholarship information updated'}
  html='<main><h1>Scholarships</h1><p>'+('Funding conditions for international students. '*5)+'</p></main>'
  first=collect(source,lambda _:html,date(2026,10,12),{})
  self.assertEqual(first[0],[])
  stable=collect(source,lambda _:html,date(2026,10,13),first[1]);self.assertEqual(stable[0],[])
  changed=collect(source,lambda _:html.replace('Funding conditions','Revised conditions'),date(2026,10,13),first[1])
  self.assertEqual(changed[0][0]['dateBasis'],'detected_content_change')
if __name__=='__main__':unittest.main()
