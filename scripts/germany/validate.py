from pathlib import Path
from urllib.parse import urlsplit,unquote
from html.parser import HTMLParser
import json,re
ROOT=Path(__file__).resolve().parents[2];G=ROOT/'germany'
class Links(HTMLParser):
 def __init__(self):super().__init__();self.urls=[];self.ids=set()
 def handle_starttag(self,t,a):
  d=dict(a)
  if 'id'in d:self.ids.add(d['id'])
  self.urls.extend(d[k] for k in ('href','src') if k in d)
errors=[]
for f in G.glob('*.html'):
 p=Links();p.feed(f.read_text())
 for url in p.urls:
  u=urlsplit(url)
  if u.scheme or u.netloc:continue
  path=(ROOT/u.path.lstrip('/')) if u.path.startswith('/') else f.parent/unquote(u.path) if u.path else f
  if path.is_dir():path=path/'index.html'
  if not path.exists():errors.append(str(f.relative_to(ROOT))+': missing '+url)
  elif u.fragment and path.suffix=='.html':
   target=Links();target.feed(path.read_text())
   if u.fragment not in target.ids:errors.append(str(f.relative_to(ROOT))+': missing anchor '+url)
students=json.loads((G/'students.json').read_text());assert [s['id'] for s in students]==['riko-asahi','megumi-yamada','airi-kawakita','aina']
for s in students:assert (G/'images'/s['photo']).is_file()
for n in ['rankings','economy','news','guides']:
 d=json.loads((G/'data'/f'{n}.json').read_text());s=(G/'data'/f'{n}.js').read_text();assert json.loads(s.split('=',1)[1].strip().rstrip(';'))==d
for r in json.loads((G/'data/rankings.json').read_text())['records']:
 assert re.fullmatch(r'=?[1-9]\d*(?:[-–][1-9]\d*|\+)?',r['rank'])
assert not errors,'\n'.join(errors)
print('PASS: local HTML assets, links, anchors, students and JSON/JS parity')
