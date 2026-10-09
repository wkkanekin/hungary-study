"""Read-only supplemental Wikimedia image discovery; output requires review."""
import html,json,pathlib,re,time,urllib.parse,urllib.request
ROOT=pathlib.Path(__file__).resolve().parents[2]
queries={
'u1':'"Universität Freiburg" Kollegiengebäude',
'u19':'"Technische Universität Nürnberg"',
'u30':'"Hochschule München" Gebäude',
'u56':'"Apollon Hochschule"',
'u65':'"Euro-FH"',
'u81':'"Archivschule Marburg"',
'u105':'"Universität Bielefeld" Gebäude',
'u106':'"Ruhr-Universität Bochum" Gebäude',
'u126':'"Hochschule Mainz" Campus',
'u130':'"Theologische Fakultät Trier"',
'u135':'"Hochschule für Musik Saar"',
'u158':'"Hochschule Flensburg"',
'u160':'"Fachhochschule Westküste"',
'iu-muenchen':'"IU" "München"',
'u29':'"Hochschule Landshut" Gebäude',
'u62':'"Hochschule für Musik und Theater Hamburg" Gebäude',
'u149':'"Hochschule für Grafik und Buchkunst Leipzig" Gebäude',
'u163':'"Nordakademie" Elmshorn'
}
def clean(s):return html.unescape(re.sub('<[^>]+>','',s or '')).strip()
results=[]
for uid,q in queries.items():
    url='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',generator='search',gsrnamespace=6,gsrsearch=q,gsrlimit=25,prop='imageinfo',iiprop='url|extmetadata|size',iiurlwidth=960))
    row={'id':uid,'query':q,'candidates':[]}
    try:
        req=urllib.request.Request(url,headers={'User-Agent':'HungaryStudyLabCampusPhotos/1.0 (https://hungarystudy.org/)'})
        with urllib.request.urlopen(req,timeout=60) as r:d=json.load(r)
        for p in d.get('query',{}).get('pages',{}).values():
            ii=(p.get('imageinfo') or [{}])[0];m=ii.get('extmetadata',{})
            if not ii.get('url'):continue
            lic=clean(m.get('LicenseShortName',{}).get('value'))
            if not re.search(r'CC0|CC BY|CC-BY|Public domain|free use',lic,re.I):continue
            row['candidates'].append(dict(src=ii.get('thumburl') or ii['url'],original=ii['url'],file=p['title'],caption=clean(m.get('ImageDescription',{}).get('value')),author=clean(m.get('Artist',{}).get('value')),license=lic,licenseUrl=m.get('LicenseUrl',{}).get('value',''),source=ii.get('descriptionurl',''),width=ii['width'],height=ii['height']))
    except Exception as exc:row['error']=str(exc)
    results.append(row)
    time.sleep(3)
out=ROOT/'germany/data/campus-photo-candidates.json'
out.write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
print('CAMPUS_PHOTO_CANDIDATES='+json.dumps(results,ensure_ascii=False,separators=(',',':')),flush=True)
