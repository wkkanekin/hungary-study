#!/usr/bin/env python3
"""Sync public note posts for Germany Study Lab. Uses note's public creator API.
Never fabricates dates, images, or post URLs; preserves last good output on failure.
"""
import json, re, time, html, urllib.request, urllib.parse
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "germany" / "data" / "note-posts.json"
AUTHORS = [
    {"id":"megumi-yamada","name":"山田恵","username":"bratsche_viola"},
    {"id":"airi-kawakita","name":"河北彩里","username":"akunigermany"},
]
def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (compatible; GermanyStudyLab/1.0)","Accept":"application/json"})
    with urllib.request.urlopen(req,timeout=25) as res:
        return json.load(res)

def plain(s):
    return re.sub(r"\s+"," ",html.unescape(re.sub("<[^>]*>"," ",s or ""))).strip()

def sync_author(a):
    posts, seen = [], set()
    for page in range(1,101):
        url=f"https://note.com/api/v2/creators/{a['username']}/contents?kind=note&page={page}"
        data=get_json(url)
        obj=data.get("data") or {}
        items=obj.get("contents",[]) if isinstance(obj,dict) else obj
        if not isinstance(items,list): raise ValueError("Unexpected note API response")
        if not items: break
        new=0
        for p in items:
            key=p.get("key") or p.get("id")
            if not key or str(key) in seen: continue
            seen.add(str(key));new+=1
            article_url=p.get("noteUrl") or p.get("note_url") or f"https://note.com/{a['username']}/n/{key}"
            if not article_url.startswith(f"https://note.com/{a['username']}/n/"): continue
            date=p.get("publishAt") or p.get("publish_at") or p.get("publishedAt") or p.get("createdAt") or ""
            img=p.get("eyecatch") or p.get("eyecatchUrl") or p.get("thumbnailUrl") or ""
            if isinstance(img,dict): img=img.get("url","")
            if img and not img.startswith("https://"): img=""
            title=plain(p.get("name") or p.get("title") or "")
            if not title: continue
            desc=plain(p.get("description") or p.get("body") or "")[:180]
            posts.append({"authorId":a["id"],"author":a["name"],"title":title,"date":str(date)[:10],"summary":desc,"image":img,"url":article_url})
        if not new: break
        time.sleep(.25)
    return posts

def main():
    existing=[]
    if OUT.exists():
        try: existing=json.loads(OUT.read_text(encoding="utf-8")).get("posts",[])
        except (ValueError, OSError): pass
    combined=[];errors=[]
    for a in AUTHORS:
        try:
            items=sync_author(a)
            if not items: raise ValueError("No public articles returned")
            combined.extend(items)
            print(a["username"],len(items))
        except Exception as e:
            errors.append(f"{a['username']}: {e}")
            combined.extend(p for p in existing if p.get("authorId")==a["id"])
    unique={p["url"]:p for p in combined}
    posts=sorted(unique.values(),key=lambda p:p.get("date",""),reverse=True)
    if not posts: raise RuntimeError("No articles found; refusing to overwrite output")
    OUT.parent.mkdir(parents=True,exist_ok=True)
    OUT.write_text(json.dumps({"updatedAt":datetime.now(timezone.utc).isoformat(),"posts":posts,"errors":errors},ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("total",len(posts),"errors",errors)
    if errors: raise RuntimeError("; ".join(errors))
if __name__=="__main__": main()
