import unittest,json,tempfile
from pathlib import Path
from unittest.mock import patch
import refresh
from ranking_sources import parse
class Guards(unittest.TestCase):
 def test_multiple_series_rejected(self):
  with self.assertRaises(AssertionError):refresh.latest_stat(json.dumps({'id':['geo','time'],'size':[2,1]}))
 def test_missing_value_not_zero(self):
  raw={'id':['geo','time'],'size':[1,2],'dimension':{'time':{'category':{'index':{'2024':0,'2025':1}}}},'value':{'0':10}}
  self.assertEqual(refresh.latest_stat(json.dumps(raw))[:2],('2024',10))
 def test_failure_preserves_news_and_economy(self):
  with tempfile.TemporaryDirectory() as d:
   with patch.object(refresh,'DATA',Path(d)),patch.object(refresh,'fetch',side_effect=RuntimeError('offline')):
    news={'items':[{'title':'Previously checked','date':'2025-01-01','url':'https://www.daad.jp/ja/2025/01/01/test/'}],'checkedOn':'2025-01-02'}
    economy={'metrics':[{'id':'annual-wage','value':12345,'period':'2024','checkedOn':'2025-01-02'}]}
    refresh.save('news',news);refresh.save('economy',economy);refresh.news();refresh.economy()
    self.assertEqual(refresh.load('news',{})['items'],news['items'])
    self.assertEqual(refresh.load('economy',{})['metrics'][0],economy['metrics'][0])
 def test_ranking_failure_preserves(self):
  with tempfile.TemporaryDirectory() as d:
   with patch.object(refresh,'DATA',Path(d)),patch.object(refresh,'fetch',side_effect=RuntimeError('403')):
    row={'university':'Test University','provider':'THE','subject':'総合','year':2026,'rank':'101-125','source':'https://www.timeshighereducation.com/test','checkedOn':'2025-01-01'}
    refresh.save('rankings',{'records':[row]});refresh.rankings();self.assertEqual(refresh.load('rankings',{})['records'],[row])
 def test_ranking_band(self):
  parsed=parse('THE','<h1>Test University</h1><h4>Computer Science 2026 101-125th</h4>')
  self.assertEqual(parsed['rankings']['Computer Science']['rank'],'101-125')
if __name__=='__main__':unittest.main()
