"""Check published directory image URLs; never write back to the repository."""
import concurrent.futures,json,pathlib,time,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
images=json.loads((ROOT/'germany/data/campus-photos.js').read_text().split('=',1)[1].strip().rstrip(';'))
def check(item):
    uid,p=item
    url=p['src']
    if not url.startswith('https://'):
        return dict(id=uid,status='local',src=url)
    time.sleep(1)
    try:
        req=urllib.request.Request(url,method='HEAD',headers={'User-Agent':'HungaryStudyLabPhotoValidation/1.0 (https://hungarystudy.org/)'})
        with urllib.request.urlopen(req,timeout=15) as r:
            return dict(id=uid,status=r.status,type=r.headers.get('Content-Type',''),src=url)
    except Exception as e:return dict(id=uid,status='error',error=str(e),src=url)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    rows=list(pool.map(check,images.items()))
(ROOT/'germany/data/campus-photo-candidates.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')
print('CAMPUS_PHOTO_CHECKS='+json.dumps(rows,ensure_ascii=False,separators=(',',':')),flush=True)
print(json.dumps({'total':len(rows),'failed':[r['id'] for r in rows if r['status']=='error']},ensure_ascii=False),flush=True)
