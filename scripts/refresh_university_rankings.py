"""Refresh confirmed ranking editions, including newly published years. Failed/mismatched sources never erase evidence."""
import argparse,concurrent.futures,copy,json,sys,unicodedata,urllib.request
from datetime import datetime,timezone
from pathlib import Path
from ranking_sources import parse,validate_url
from build_university_rankings import ROOT,DATA,build,validate

def title_key(title):
    return ''.join(c for c in unicodedata.normalize('NFKD',title).lower() if c.isalnum())
def fetch_source(source):
    validate_url(source['url'])
    req=urllib.request.Request(source['url'],headers={'User-Agent':'HungaryStudy-Rankings/1.0 (+https://hungarystudy.org/guide-university-ranking.html)'})
    with urllib.request.urlopen(req,timeout=25) as response:
        validate_url(response.geturl())
        raw=response.read(5_000_001)
        if len(raw)>5_000_000:raise ValueError('Source too large')
        html=raw.decode('utf-8')
    result=parse(source['provider'],html)
    if title_key(result['title'])!=title_key(source['institution_title']):raise ValueError('Institution heading changed; review required')
    return result

def update_record(record,result,label,today):
    result_record=copy.deepcopy(record)
    rank=result.get('rankings',{}).get(label) if isinstance(result,dict) else None
    max_year=int(today[:4])+1
    if rank and record['year']<=rank['year']<=max_year:
        result_record.update(rank,status='ranked',checked_at=today)
        result_record['latest_attempt']={'at':today,'status':'ok'}
        result_record.pop('note',None)
    else:
        reason='edition_or_subject_not_confirmed' if isinstance(result,dict) else 'source_fetch_failed'
        result_record['latest_attempt']={'at':today,'status':'needs_review' if isinstance(result,dict) else 'failed','reason':reason}
        # Preserve every field of the last verified rank including its edition and checked date.
        if record['status'] not in ('ranked','not_listed'):
            result_record['status']='unconfirmed' if isinstance(result,dict) else 'fetch_failed'
    return result_record

def refresh(data,results,today):
    out=copy.deepcopy(data)
    for u in out['universities']:
        for provider,r in u['overall'].items():
            if not r.get('source_id'):continue
            label='Academic Ranking of World Universities' if provider=='ARWU' else 'World University Rankings'
            u['overall'][provider]=update_record(r,results.get(r['source_id']),label,today)
    out['subjects']=[update_record(r,results.get(r['source_id']),r['official_subject'],today) for r in out['subjects']]
    for provider in out['target_editions']:
        years=[u['overall'][provider]['year'] for u in out['universities'] if u['overall'][provider]['status']=='ranked']
        out['target_editions'][provider]=max([out['target_editions'][provider],*years])
        for u in out['universities']:
            r=u['overall'][provider]
            if r['status'] in ('unconfirmed','fetch_failed'):r['year']=out['target_editions'][provider]
    out['subject_target_year']=max(r['year'] for r in out['subjects'])
    validate(out);return out

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--dry-run',action='store_true');args=ap.parse_args()
    data=json.loads(DATA.read_text());validate(data);results={};errors={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(fetch_source,s):key for key,s in data['sources'].items()}
        for f in concurrent.futures.as_completed(futures):
            key=futures[f]
            try:results[key]=f.result()
            except Exception as exc:errors[key]=str(exc)
    today=datetime.now(timezone.utc).date().isoformat();updated=refresh(data,results,today)
    if not args.dry_run:
        # Validation happens before writes. A workflow publishes JSON and both HTML files in one git commit.
        build(updated)
        temp=DATA.with_suffix('.json.tmp');temp.write_text(json.dumps(updated,ensure_ascii=False,indent=2)+'\n');temp.replace(DATA)
    records=[r for u in updated['universities'] for r in u['overall'].values()]+updated['subjects']
    summary={'sources_ok':len(results),'sources_failed':len(errors),'records_updated':sum(r.get('latest_attempt',{}).get('status')=='ok' for r in records),'records_preserved_after_failure':sum(r.get('latest_attempt',{}).get('status')=='failed' for r in records),'records_need_review':sum(r.get('latest_attempt',{}).get('status')=='needs_review' for r in records),'errors':errors,'dry_run':args.dry_run}
    print(json.dumps(summary,ensure_ascii=False,indent=2))
if __name__=='__main__':main()
