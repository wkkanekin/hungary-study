"""Collect attributed campus-photo candidates from exact university articles.

The output is a review manifest, not a published photo assignment.
"""
import concurrent.futures
import html
import json
import pathlib
import re
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
UA = 'HungaryStudyLabCampusPhotos/1.0 (https://hungarystudy.org/; campus image attribution)'

def api(host, **params):
    url = 'https://' + host + '/w/api.php?' + urllib.parse.urlencode(dict(action='query', format='json', **params))
    req = urllib.request.Request(url, headers={'User-Agent': UA})
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=40) as r:
                return json.load(r)
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2 * (attempt + 1))

def clean(value):
    return html.unescape(re.sub('<[^>]+>', '', value or '')).strip()

aliases = {
    'u4': 'Karlsruher Institut für Technologie',
    'u56': 'Apollon Hochschule der Gesundheitswirtschaft',
    'u63': 'Helmut-Schmidt-Universität/Universität der Bundeswehr Hamburg',
    'u66': 'Hamburg School of Business Administration',
    'u79': 'Städelschule',
    'u80': 'Hochschule Geisenheim',
    'u118': 'Rheinland-Pfälzische Technische Universität Kaiserslautern-Landau',
    'u159': 'Fachhochschule Kiel',
    'u165': 'Hochschule für Musik Franz Liszt Weimar',
    'iu-muenchen': 'IU Internationale Hochschule',
}
data = json.loads((ROOT / 'germany/data/universities.js').read_text().split('=', 1)[1].strip().rstrip(';'))
universities = data['universities']

def article(u):
    title = aliases.get(u['id'], u['name'])
    result = api('de.wikipedia.org', titles=title, redirects=1, prop='images|pageimages', imlimit=50, piprop='name', pithumbsize=1200)
    p = next(iter(result.get('query', {}).get('pages', {}).values()), {})
    files = [i['title'].replace('Datei:', 'File:', 1) for i in p.get('images', [])]
    return u['id'], dict(article=p.get('title', title), articleUrl='https://de.wikipedia.org/wiki/' + urllib.parse.quote(p.get('title', title).replace(' ', '_')), files=files, pageimage=p.get('pageimage'))

articles = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
    for u, future in [(u, pool.submit(article, u)) for u in universities]:
        try:
            uid, a = future.result()
            articles[uid] = a
        except Exception as exc:
            articles[u['id']] = {'error': str(exc), 'files': []}

excluded = re.compile(r'logo|signet|wappen|coat.of.arms|flag|karte|map|portrait|porträt|siegel|seal|icon|graph|diagram|commons-logo|wikidata', re.I)
files = sorted({f for a in articles.values() for f in a['files'] if re.search(r'\.(jpe?g|png|webp)$', f, re.I) and not excluded.search(f)})
info = {}
for start in range(0, len(files), 40):
    try:
        result = api('commons.wikimedia.org', titles='|'.join(files[start:start+40]), prop='imageinfo', iiprop='url|extmetadata|size', iiurlwidth=1200)
        for p in result.get('query', {}).get('pages', {}).values():
            if p.get('imageinfo'):
                info[p['title']] = p['imageinfo'][0]
    except Exception as exc:
        print('Metadata batch:', str(exc), flush=True)

building = re.compile(r'campus|universit|hochschul|gebäude|building|fassade|schloss|mensa|bibliothek|institut|lecture|auditorium|college|facult|hauptgeb|rathaus', re.I)
person = re.compile(r'portrait|porträt|professor|rector|rektor|präsident|president|headshot', re.I)
results = []
for u in universities:
    a = articles[u['id']]
    city = u['cityId'].split('|')[1]
    candidates = []
    for f in a['files']:
        ii = info.get(f)
        if not ii or excluded.search(f) or ii.get('width', 0) < 450:
            continue
        meta = ii.get('extmetadata', {})
        desc = clean(meta.get('ImageDescription', {}).get('value'))
        license = clean(meta.get('LicenseShortName', {}).get('value'))
        if not license or not re.search(r'CC0|CC BY|CC-BY|Public domain|free use', license, re.I):
            continue
        text = f + ' ' + desc
        if person.search(text) or not building.search(text):
            continue
        score = 10 + (10 if re.search(re.escape(city), text, re.I) else 0) + (10 if re.search(r'campus|hauptgeb|main.building', text, re.I) else 0)
        if f.split(':', 1)[1] == a.get('pageimage'):
            score += 15
        if u['id'] == 'iu-muenchen' and not re.search(r'münchen|munich|muenchen', text, re.I):
            continue
        candidates.append(dict(src=ii.get('thumburl') or ii['url'], original=ii['url'], file=f, caption=desc, author=clean(meta.get('Artist', {}).get('value')), license=license, licenseUrl=meta.get('LicenseUrl', {}).get('value', ''), source=ii.get('descriptionurl', ''), width=ii['width'], height=ii['height'], score=score))
    candidates.sort(key=lambda p: (-p['score'], p['file']))
    results.append(dict(id=u['id'], name=u['name'], city=city, article=a.get('article'), articleUrl=a.get('articleUrl'), candidates=candidates[:4], error=a.get('error')))
out = ROOT / 'germany/data/campus-photo-candidates.json'
out.write_text(json.dumps(results, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'universities':len(results),'withCandidates':sum(bool(x['candidates']) for x in results),'missing':[x['name'] for x in results if not x['candidates']]},ensure_ascii=False),flush=True)
