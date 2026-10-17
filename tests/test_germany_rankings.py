import unittest,json,re,subprocess
from pathlib import Path
from html.parser import HTMLParser
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
 def __init__(self):super().__init__();self.table=None;self.rows={'overallTable':[],'subjectTable':[]};self.options={};self.select=None;self.row=None;self.links=[]
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='table':self.table=a.get('id')
  if tag=='tr' and a.get('data-university'):self.row={'dataset':{k[5:]:v for k,v in a.items() if k.startswith('data-')},'cells':[]};self.rows[self.table].append(self.row)
  if tag=='td' and self.row and 'data-provider' in a:self.row['cells'].append({'provider':a['data-provider'],'rank':a['data-rank']})
  if tag=='select':self.select=a['id'];self.options[self.select]=[]
  if tag=='option' and self.select:self.options[self.select].append(a.get('value',''))
  if tag=='a' and a.get('href'):self.links.append(a['href'])
 def handle_endtag(self,tag):
  if tag=='table':self.table=None
  if tag=='tr':self.row=None
  if tag=='select':self.select=None
class Rankings(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.data=json.loads((ROOT/'germany/data/ranking-catalog.json').read_text());cls.page=Page();cls.page.feed((ROOT/'germany/rankings.html').read_text())
 def test_sources_editions_and_identity(self):
  rows=self.data['records'];self.assertEqual(len({(r['university'],r['provider'],r['subject'],r['year']) for r in rows}),len(rows))
  for r in rows:
   self.assertRegex(r['rank'],r'^=?[1-9]\d{0,3}(?:[-–][1-9]\d{0,3}|\+)?$');self.assertEqual(r['year'],self.data['editions'][r['provider']] if r['subject']=='総合' else 2026);self.assertTrue(r['source'].startswith(('https://www.qs-topuniversities.cn/','https://www.timeshighereducation.com/','https://www.shanghairanking.com/')))
  by={u['id']:u for u in self.data['universities']};self.assertEqual([by['tum']['overall'][p]['rank'] for p in ['QS','THE','ARWU']],['25','25','45']);self.assertNotIn('Ulm University',by['lmu']['aliases']);self.assertEqual(by['ulm']['overall']['THE']['rank'],next(r['rank'] for r in rows if r['university']=='ulm' and r['provider']=='THE' and r['subject']=='総合'))
 def test_static_content_and_links(self):
  self.assertEqual(len(self.page.rows['overallTable']),len(self.data['universities']));self.assertEqual(len(self.page.rows['subjectTable']),661)
  for link in self.page.links:
   if not link.startswith(('https:','#')):self.assertTrue((ROOT/'germany'/link.split('#')[0]).exists(),link)
  for p in (ROOT/'germany').glob('*.html'):
   s=p.read_text();nav=re.search(r'<nav\b.*?</nav>',s,re.S)
   if nav and 'class="topNav"' in nav[0]:self.assertRegex(nav[0],r'大学ガイド</a><a href="rankings.html"(?: aria-current="page")?>ドイツ大学ランキング')
 def test_interactions(self):
  payload={'rows':self.page.rows,'states':sorted({u['state'] for u in self.data['universities']}),'cities':sorted({u['city'] for u in self.data['universities']}),'disciplines':sorted({r['subject'] for r in self.data['records'] if r['subject']!='総合'})}
  subprocess.run(['node',str(ROOT/'tests/test_germany_rankings_dom.cjs')],input=json.dumps(payload),text=True,check=True,cwd=ROOT)
if __name__=='__main__':unittest.main()
