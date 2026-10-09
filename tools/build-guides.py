#!/usr/bin/env python3
"""Build reviewed university content only. Python 3, standard library."""
from pathlib import Path
from html import escape
from datetime import date
from urllib.parse import urlsplit
import json,re
from guide_detail import render
ROOT=Path(__file__).resolve().parents[1]
G=ROOT/'germany';D=G/'data'
e=lambda s:escape(str(s),quote=True)
def read_js(path):return json.loads(path.read_text().split('=',1)[1].strip().rstrip(';'))
def section(title,text):return '<section><h2>'+e(title)+'</h2><p>'+e(text)+'</p></section>'
def link(url,label):return '<a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+e(label)+' ↗</a>'
guides=json.loads((D/'guides.json').read_text())
template=(ROOT/'tools/templates/university-guide.html').read_text()
students={s['id'] for s in json.loads((G/'students.json').read_text())}
assert len({g['id'] for g in guides})==len(guides),'Duplicate guide ID'
universities=read_js(D/'universities.js')
pages={}; updates=[]; matched={}
for g in guides:
 assert re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*',g['id']),'Invalid guide ID'
 date.fromisoformat(g['checkedOn'])
 assert g['sections'] and g['links'],'Guide needs reviewed content and sources'
 for label,url in g['links']:assert urlsplit(url).scheme=='https' and urlsplit(url).netloc
 if g.get('student'):assert g['student'] in students,'Unknown student'
 matches=[u for u in universities['universities'] if g['match'] in u['name'] or (g['id']=='tuhh' and u['id']=='tuhh') or (g['id']=='iu' and u['id']=='iu-muenchen')]
 for u in matches:
  assert u['id'] not in matched,'Ambiguous guide match: '+u['id']
  matched[u['id']]=g
 body=render(g)
 pages['guide-'+g['id']+'.html']=template.replace('{{TITLE}}',e(g['title'])).replace('{{LEAD}}',e(g['intro'])).replace('{{BODY}}',body)
 updates.append({'title':g['title']+'のガイド','date':g.get('publishedOn',g['checkedOn']),'url':'guide-'+g['id']+'.html','category':'大学ガイド','enabled':True})
# All input validation finishes before modifying generated files.
for name,html in pages.items():(G/name).write_text(html)
for u in universities['universities']:
 g=matched.get(u['id'])
 if g:u['guideUrl']='guide-'+g['id']+'.html'
 elif u.get('guideUrl','').startswith('guide-'):u.pop('guideUrl',None)
(D/'universities.js').write_text('window.GERMANY_UNIVERSITIES = '+json.dumps(universities,ensure_ascii=False,indent=2)+';\n')
(D/'guides.js').write_text('window.GERMANY_GUIDES = '+json.dumps(guides,ensure_ascii=False,indent=2)+';\n')
manual=json.loads((G/'updates.json').read_text());seen={u['url'] for u in manual}
(D/'updates.js').write_text('window.GERMANY_UPDATES = '+json.dumps(manual+[u for u in updates if u['url'] not in seen],ensure_ascii=False,indent=2)+';\n')
f=G/'universities.html';html=f.read_text()
html=re.sub(r'個別ガイドは\d+件です。','個別ガイドは'+str(len(guides))+'件です。',html)
html=re.sub(r'(<h2>確認済みの大学ガイド</h2>)\s*<ul>.*?</ul>',lambda m:m[1]+'<ul>'+''.join('<li><a href="guide-'+e(g['id'])+'.html">'+e(g['title'])+'</a></li>' for g in guides)+'</ul>',html,flags=re.S)
f.write_text(html)
# The ledger distinguishes location evidence, guide content and brochure review.
ledger={'scope':'既存の掲載大学・拠点のみ。全国の大学台帳は未完成。','records':[]}
for u in universities['universities']:
 g=matched.get(u['id']);ledger['records'].append({'id':u['id'],'name':u['name'],'locationSource':u['sourceUrl'],'locationCheckedOn':u['checkedOn'],'guideStatus':'official_web_reviewed' if g else 'not_reviewed','guideUrl':u.get('guideUrl'),'guideCheckedOn':g['checkedOn'] if g else None,'guideSources':g['links'] if g else [],'brochureStatus':g.get('brochureStatus','not_reviewed') if g else 'not_reviewed'})
(ROOT/'docs').mkdir(exist_ok=True)
(ROOT/'docs/university-research-ledger.json').write_text(json.dumps(ledger,ensure_ascii=False,indent=2)+'\n')
print('Built',len(guides),'guides, directory links, updates and research ledger.')
