#!/usr/bin/env python3
"""Official-source refresh. Run from repository root; failures preserve the last verified values."""
from pathlib import Path
import json,re,datetime,xml.etree.ElementTree as ET,concurrent.futures,sys
import requests
from bs4 import BeautifulSoup
from ranking_sources import parse,validate_url
ROOT=Path(__file__).resolve().parents[2]; DATA=ROOT/'germany/data'
TODAY=datetime.date.today().isoformat(); errors=[]
def load(n,default):
 p=DATA/(n+'.json');return json.loads(p.read_text()) if p.exists() else default
def save(n,obj):
 for ext,content in [('json',json.dumps(obj,ensure_ascii=False,indent=2)+'\n'),('js','window.GERMANY_'+n.upper().replace('-','_')+' = '+json.dumps(obj,ensure_ascii=False)+';\n')]:
  p=DATA/(n+'.'+ext);tmp=p.with_suffix('.tmp');tmp.write_text(content);tmp.replace(p)
def fetch(url):
 r=requests.get(url,timeout=(20,30),headers={'User-Agent':'GermanyStudyLab-OfficialData/1.0'});r.raise_for_status()
 if len(r.content)>12000000:raise ValueError('Unexpected response size')
 return r.text
def latest_stat(raw):
 d=json.loads(raw);ids=d['id'];assert ids[-1]=='time'
 assert all(n==1 for n in d['size'][:-1]),'Multiple series: filters required'
 idx=d['dimension']['time']['category']['index']; vals=d['value']; candidates=[]
 for period,i in idx.items():
  v=vals.get(str(i)) if isinstance(vals,dict) else vals[i]
  if v is not None and isinstance(v,(int,float)):
   assert period[:4]<=TODAY[:4],'Future observation'
   candidates.append((period,float(v),d.get('status',{}).get(str(i),'')))
 assert candidates,'No data'
 return max(candidates)
def economy():
 old=load('economy',{'metrics':[]});by={r['id']:r for r in old['metrics']}
 sources=[('inflation','消費者物価・前年同月比','%','prc_hicp_minr?geo=DE&unit=RCH_A&coicop18=TOTAL&sinceTimePeriod=2025-01&lang=EN','Eurostat HICP。総合指数の前年同月比。'),('annual-wage','平均年間給与（フルタイム換算・額面）','EUR/年','nama_10_fte?geo=DE&unit=EUR&sinceTimePeriod=2022&lang=EN','Eurostat。学生アルバイトの時給や手取りではありません。'),('monthly-minimum','最低賃金の月額換算（額面）','EUR/月','earn_mw_cur?geo=DE&currency=EUR&sinceTimePeriod=2025-S1&lang=EN','Eurostatによる月額換算。ドイツの法定時給そのものとは別の指標です。')]
 for id,label,unit,query,note in sources:
  url='https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/'+query
  try:
   period,value,status=latest_stat(fetch(url)); assert -50<value<1000000
   if id in by and period<by[id]['period']:raise ValueError('Period rollback')
   by[id]={'id':id,'label':label,'value':value,'unit':unit,'period':period,'source':url,'checkedOn':TODAY,'note':note+(' 速報・推計値を含みます。' if status else '')}
  except Exception as exc:errors.append(id+': '+str(exc))
 try:
  url='https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml';tree=ET.fromstring(fetch(url));day=next(x.attrib['time'] for x in tree.iter() if 'time' in x.attrib);value=float(next(x.attrib['rate'] for x in tree.iter() if x.attrib.get('currency')=='JPY'))
  assert '2000-01-01'<day<=TODAY and 50<value<400
  if 'eurjpy' in by:assert day>=by['eurjpy']['period']
  by['eurjpy']={'id':'eurjpy','label':'1ユーロの円参考レート','value':value,'unit':'JPY','period':day,'source':url,'checkedOn':TODAY,'note':'ECB参考レート。送金時の適用レートや手数料とは異なります。'}
 except Exception as exc:errors.append('eurjpy: '+str(exc))
 # Legal text is reviewed manually; only effective date switches automatically.
 rates=[('2026-01-01',13.90),('2027-01-01',14.60)]
 effective,value=max(x for x in rates if x[0]<=TODAY)
 by['hourly-minimum']={'id':'hourly-minimum','label':'法定最低賃金（額面）','value':value,'unit':'EUR/時','period':effective+'から','source':'https://www.gesetze-im-internet.de/milov5/__1.html','checkedOn':'2026-10-05','note':'確認済み法令に基づく施行日切替。法改正の反映は人による確認が必要です。例外あり。'}
 save('economy',{'metrics':list(by.values()),'lastAttempt':TODAY})
SUBJECTS={'World University Rankings':'総合','Arts and Humanities':'人文・芸術','Business and Economics':'経営・経済','Medical and Health':'医学・健康','Computer Science':'コンピュータ科学','Education Studies':'教育','Engineering':'工学','Life Sciences':'生命科学','Physical Sciences':'物理科学','Social Sciences':'社会科学','Law':'法学','Psychology':'心理学'}
def rankings():
 old=load('rankings',{'records':[]});records=old['records']; jobs={}
 for r in records:jobs[(r['provider'],r['source'])]=r['university']
 def task(kv):
  (provider,url),name=kv
  try:
   validate_url(url); result=parse(provider,fetch(url))
   def norm(s):return re.sub(r'[^a-z0-9]','',s.casefold())
   aliases={'LMU Munich':'Ludwig-Maximilians-Universität München','Universität Heidelberg':'Heidelberg University'}
   assert norm(name)==norm(result['title']) or norm(aliases.get(name,''))==norm(result['title']), 'Institution title mismatch'
   assert result['rankings'],'No rankings extracted'
   return provider,url,name,result,None
  except Exception as ex:return provider,url,name,None,str(ex)
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
  for provider,url,name,result,err in pool.map(task,jobs.items()):
   if err:errors.append('ranking '+name+' '+provider+': '+err);continue
   for subject,item in result['rankings'].items():
    if subject not in SUBJECTS:continue
    label=SUBJECTS[subject];year=item['year'];assert 2000<=year<=int(TODAY[:4])+1
    previous=[r for r in records if r['university']==name and r['provider']==provider and r['subject']==label]
    if previous and max(r['year'] for r in previous)>year:continue
    records[:]=[r for r in records if not(r['university']==name and r['provider']==provider and r['subject']==label)]
    records.append({'university':name,'provider':provider,'subject':label,'year':year,'rank':item['rank'],'source':url,'checkedOn':TODAY})
 old['coverage']=f"THE総合{sum(r['provider']=='THE' and r['subject']=='総合' for r in records)}大学、THE分野別{sum(r['provider']=='THE' and r['subject']!='総合' for r in records)}件、QS総合{sum(r['provider']=='QS' and r['subject']=='総合' for r in records)}大学。全国全大学・全分野を網羅していません。"
 old['lastAttempt']=TODAY;old['records']=records;save('rankings',old)
def news():
 old=load('news',{'items':[]})
 try:
  url='https://www.daad.jp/ja/news/';s=BeautifulSoup(fetch(url),'html.parser');items=[]
  for a in s.select('a[href]'):
   u=a['href'];m=re.fullmatch(r'https://www.daad.jp/ja/(20\d{2})/(\d{2})/(\d{2})/[^/?#]+/',u)
   if not m:continue
   parent=a.find_parent(class_='c-list-teaser__item-content--news');heading=parent.find('h2') if parent else None
   if not heading:continue
   date='-'.join(m.groups());datetime.date.fromisoformat(date)
   if date>TODAY:continue
   title=heading.get_text(' ',strip=True)
   if len(title)>200:raise ValueError('Unexpected headline length')
   items.append({'title':title,'date':date,'url':u,'category':'DAAD公式ニュース'})
  assert 1<=len(items)<=100,'News selector mismatch'
  # Only headlines and source links, no copied article bodies.
  dedup={i['url']:i for i in old['items']+items};old={'items':sorted(dedup.values(),key=lambda x:x['date'],reverse=True)[:30],'checkedOn':TODAY}
 except Exception as exc:errors.append('news: '+str(exc))
 old['lastAttempt']=TODAY;save('news',old)
if __name__=='__main__':
 economy();news()
 if '--rankings' in sys.argv:rankings()
 save('update-status',{'attemptedOn':TODAY,'errors':errors,'message':'取得失敗時は直前の確認済みデータを維持します。'})
 print('Refresh complete; failures:',len(errors))
 for error in errors:print(error)
