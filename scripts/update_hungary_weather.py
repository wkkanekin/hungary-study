#!/usr/bin/env python3
"""Refresh MET Norway forecasts and NASA POWER monthly climate data (stdlib only)."""
import argparse, calendar, concurrent.futures, datetime as dt, json, os, pathlib, time, urllib.parse, urllib.request
ROOT = pathlib.Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
CITIES = {'budapest':('ブダペスト',47.4979,19.0402),'debrecen':('デブレツェン',47.5316,21.6273),'szeged':('セゲド',46.2530,20.1414),'pecs':('ペーチ',46.0727,18.2323),'gyor':('ジェール',47.6875,17.6504)}
AGENT = 'HungaryStudyLabWeather/1.0 (+https://hungarystudy.org/; https://github.com/wkkanekin/hungary-study)'
def get(url):
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':AGENT,'Accept':'application/json'})
            with urllib.request.urlopen(req,timeout=90) as r: return json.load(r)
        except Exception:
            if attempt==2: raise
            time.sleep(2**attempt)
def read(path):
    try:return json.loads(path.read_text(encoding='utf-8'))
    except (OSError,ValueError):return {}
def save(path,value):
    path.parent.mkdir(parents=True,exist_ok=True)
    tmp=path.with_suffix('.tmp');tmp.write_text(json.dumps(value,ensure_ascii=False,indent=2)+'\n',encoding='utf-8');os.replace(tmp,path)
def forecast(item):
    key,(name,lat,lon)=item
    obj=get('https://api.met.no/weatherapi/locationforecast/2.0/compact?'+urllib.parse.urlencode({'lat':lat,'lon':lon}))
    points=[]
    for x in obj['properties']['timeseries']:
        v=x['data']['instant']['details']; nxt=x['data'].get('next_1_hours') or x['data'].get('next_6_hours') or {}
        points.append({'time':x['time'],'temperature':v['air_temperature'],'wind_ms':v['wind_speed'],'humidity':v['relative_humidity'],'symbol':nxt.get('summary',{}).get('symbol_code',''),'precipitation_mm':nxt.get('details',{}).get('precipitation_amount'),'precipitation_period_hours':1 if 'next_1_hours' in x['data'] else 6})
    if len(points)<24: raise ValueError('forecast too short')
    return key,{'name':name,'latitude':lat,'longitude':lon,'provider_updated_at':obj['properties']['meta']['updated_at'],'fetched_at':dt.datetime.now(dt.timezone.utc).isoformat(),'hours':points[:72]}
def history(item):
    key,(name,lat,lon)=item; year=dt.datetime.now(dt.timezone.utc).year
    q={'start':1991,'end':year-1,'parameters':'T2M,PRECTOTCORR','community':'AG','latitude':lat,'longitude':lon,'format':'JSON'}
    obj=get('https://power.larc.nasa.gov/api/temporal/monthly/point?'+urllib.parse.urlencode(q));p=obj['properties']['parameter']
    def val(param,y,m):
        v=p.get(param,{}).get(f'{y}{m:02d}')
        return v if isinstance(v,(float,int)) and v!=-999 else None
    months=[]
    for m in range(1,13):
        def normal(param,rain=False):
            vals=[val(param,y,m) for y in range(1991,2021)]
            if any(v is None for v in vals):raise ValueError(f'Incomplete 1991-2020 baseline {key} {param} {m}')
            return round(sum(v*(calendar.monthrange(y,m)[1] if rain else 1) for y,v in zip(range(1991,2021),vals))/30,1)
        previous={str(y):val('T2M',y,m) for y in [year-1,year-2]}
        months.append({'month':m,'normal_mean':normal('T2M'),'normal_precipitation_mm':normal('PRECTOTCORR',True),'previous_mean':previous})
    return key,{'name':name,'latitude':lat,'longitude':lon,'months':months}
def main():
    args=argparse.ArgumentParser();args.add_argument('--history',action='store_true');args=args.parse_args()
    now=dt.datetime.now(dt.timezone.utc); failures=[]
    current=read(DATA/'hungary-weather-current.json');cities=current.get('cities',{})
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        fs={pool.submit(forecast,it):it[0] for it in CITIES.items()}
        for f in concurrent.futures.as_completed(fs):
            try:k,v=f.result();cities[k]=v
            except Exception as e: failures.append(f'MET {fs[f]}: {e}')
    current.update({'schema_version':1,'generated_at':now.isoformat(),'source':'MET Norway Locationforecast','source_url':'https://api.met.no/','license':'CC BY 4.0','cities':cities});save(DATA/'hungary-weather-current.json',current)
    climate=read(DATA/'hungary-climate.json');month=now.strftime('%Y-%m')
    if args.history or climate.get('refresh_month')!=month or len(climate.get('cities',{}))!=5:
        fresh={};failed=False
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            fs={pool.submit(history,it):it[0] for it in CITIES.items()}
            for f in concurrent.futures.as_completed(fs):
                try:k,v=f.result();fresh[k]=v
                except Exception as e:failed=True;failures.append(f'NASA {fs[f]}: {e}')
        if not failed:
            save(DATA/'hungary-climate.json',{'schema_version':1,'generated_at':now.isoformat(),'refresh_month':month,'normal_period':'1991–2020','comparison_years':[now.year-1,now.year-2],'source':'NASA POWER / MERRA-2','source_url':'https://power.larc.nasa.gov/','cities':fresh})
    for e in failures:print(e)
    if failures:raise SystemExit(1)
    print('Updated 5 cities. Weather forecasts hourly; climate baseline 1991–2020, previous two calendar years.')
if __name__=='__main__':main()
