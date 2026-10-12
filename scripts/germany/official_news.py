"""Germany official news: dated announcements and content-change monitoring."""
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta, datetime
import hashlib
import importlib.util
import json
from pathlib import Path
import re
from urllib.parse import urljoin
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup

# Reuse the existing tested HTML, date and official-host guards.
spec = importlib.util.spec_from_file_location('shared_news', Path(__file__).parents[1]/'official_news.py')
shared = importlib.util.module_from_spec(spec)
spec.loader.exec_module(shared)
RELEVANT = re.compile(r'奨学金|留学|大学|入学|ビザ|滞在許可|在留|scholarship|admission|application|international student', re.I)
EXCLUDE = re.compile(r'求人|専門調査員|高校留学|日本語教育|外国人留学生.*日本', re.I)

def eligible_jasso(soup):
    fields = {}
    for row in soup.select('tr'):
        cells = row.find_all(['th','td'], recursive=False)
        if len(cells)>=2:
            fields[shared.clean(cells[0].get_text())] = shared.clean(cells[1].get_text())
    country = fields.get('国・地域','')
    course = fields.get('留学先校の課程','')
    # Positive evidence only: other-country and language-only awards stay out.
    return bool(re.search(r'ドイツ|Germany|限定なし|制限なし|全世界|欧州|ヨーロッパ|欧州連合|\bEU\b',country,re.I)
                and re.search(r'大学学部|大学院|修士|博士',course))

def daad_items(raw, base):
    items = []
    if '/feed/' in base:
        root = ET.fromstring(raw)
        for item in root.findall('./channel/item'):
            url = item.findtext('link','')
            title = shared.clean(item.findtext('title',''))
            match = re.search(r'/ja/(20\d{2})/(\d{2})/(\d{2})/',url)
            if match: items.append(dict(title=title,date='-'.join(match.groups()),url=url))
    else:
        soup = BeautifulSoup(raw,'html.parser')
        for anchor in soup.select('a[href]'):
            url = urljoin(base,anchor['href'])
            match = re.fullmatch(r'https://www.daad.jp/ja/(20\d{2})/(\d{2})/(\d{2})/[^/?#]+/',url)
            if not match: continue
            parent = anchor.find_parent(class_='c-list-teaser__item-content--news')
            heading = parent.find('h2') if parent else anchor.find(['h2','h3'])
            title = shared.clean((heading or anchor).get_text(' ',strip=True))
            if title: items.append(dict(title=title,date='-'.join(match.groups()),url=url))
    return [dict(i,category='DAAD公式ニュース') for i in items
            if shared.safe_url(i['url'],['www.daad.jp']) and 5<=len(i['title'])<=200
            and RELEVANT.search(i['title']) and not EXCLUDE.search(i['title'])]

def collect(source, fetch, today, state):
    source = dict(source,url=source['url'].replace('{year}',str(today.year)))
    name, url = source['name'],source['url']
    records, items, failures = {}, [], []
    if source['kind']=='daad':
        attempts=[]
        for endpoint in [url]+source.get('alternatives',[]):
            try:
                items=daad_items(fetch(endpoint),endpoint)
                items=[i for i in items if date.fromisoformat(i['date'])<=today]
                if not items: raise ValueError('No eligible dated headlines')
                return items,records,[],dict(name=name,checkedOn=today.isoformat(),endpoint=endpoint)
            except Exception as exc: attempts.append(str(exc))
        raise ValueError('; '.join(attempts))
    soup=BeautifulSoup(fetch(url),'html.parser')
    if source['kind']=='watch':
        headings=soup.select('h1,h2,h3')
        if not any(re.search(source['expected_heading'],h.get_text(),re.I) for h in headings):
            raise ValueError('Official page heading mismatch')
        _,_,body,digest=shared.article_info(soup)
        previous=state.get(url,{})
        records[url]={'fingerprint':digest,'checkedOn':today.isoformat()}
        if previous.get('fingerprint') and previous['fingerprint']!=digest:
            items.append(dict(title=source['title'],url=url,date=today.isoformat(),category=name+'・公式情報更新',dateBasis='detected_content_change'))
    else:
        if not soup.select(source['selector']): raise ValueError('News selector matched no entries')
        if source['kind']=='mofa':
            entries=shared.candidates(soup,source)
        else:
            entries=[]
            for card in soup.select(source['selector']):
                a=card.select_one('a[href]'); h=card.select_one(source['title_selector'])
                if not a or not h: continue
                entries.append(dict(url=urljoin(url,a['href']),title=shared.clean(h.get_text()),date=shared.parse_date(card.get_text(' ',strip=True))))
        for entry in entries[:30]:
            title=entry['title'];stamp=entry['date'];link=entry['url']
            if not stamp or not today-timedelta(days=30)<=stamp<=today: continue
            if not shared.safe_url(link,source['hosts']) or not RELEVANT.search(title) or EXCLUDE.search(title): continue
            try:
                if source['kind']=='jasso':
                    if not re.search(r'/scholarship/search/data_\d+\.html$',link): continue
                    page=BeautifulSoup(fetch(link),'html.parser')
                    if not eligible_jasso(page): continue
                items.append(dict(title=title[:200],url=link,date=stamp.isoformat(),category=name+'公式ニュース'))
            except Exception as exc: failures.append(name+' article '+link+': '+str(exc))
    return items,records,failures,dict(name=name,checkedOn=today.isoformat(),endpoint=url)

def write(path,value):
    text=json.dumps(value,ensure_ascii=False,indent=2)+'\n'
    tmp=path.with_suffix('.tmp');tmp.write_text(text);tmp.replace(path)

def refresh_news(data,fetch,today_text):
    today=date.fromisoformat(today_text)
    config_path=Path(__file__).parents[2]/'germany/data/news-sources.json'
    config=json.loads(config_path.read_text())
    old=json.loads((data/'news.json').read_text()) if (data/'news.json').exists() else {'items':[]}
    state=json.loads((data/'news-state.json').read_text()) if (data/'news-state.json').exists() else {}
    by={i['url']:i for i in old['items']};failures=[];statuses=[]
    def worker(source):
        try:return collect(source,fetch,today,state)
        except Exception as exc:return [],{},[source['name']+': '+str(exc)],dict(name=source['name'],error=str(exc))
    with ThreadPoolExecutor(max_workers=4) as pool:
        for items,records,errors,status in pool.map(worker,config['sources']):
            by.update({i['url']:i for i in items});state.update(records);failures.extend(errors);statuses.append(status)
    old['items']=sorted(by.values(),key=lambda i:i['date'],reverse=True)[:100]
    old['lastAttempt']=today_text
    if any('checkedOn' in s for s in statuses):old['checkedOn']=today_text
    report=dict(attemptedOn=today_text,sources=statuses,errors=failures)
    write(data/'news.json',old)
    (data/'news.js').write_text('window.GERMANY_NEWS = '+json.dumps(old,ensure_ascii=False)+';\n')
    write(data/'news-state.json',state);write(data/'news-status.json',report)
    return report
