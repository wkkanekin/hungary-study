"""Build both public ranking tables from one verified JSON file (no browser fetch)."""
import argparse,json,re,sys
from pathlib import Path
from html import escape
from urllib.parse import urlparse
TYPES={'university':'大学','university of applied sciences':'応用科学大学','college':'カレッジ'}
from ranking_sources import normalize_rank,validate_url
ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'university-rankings-data.json'
STATES={'ranked','not_listed','unconfirmed','fetch_failed'}
def esc(value):return escape(str(value),quote=True)
def validate(data):
    assert data['schema_version']==1
    assert len(data['universities'])>0
    ids=[u['id'] for u in data['universities']];assert len(ids)==len(set(ids))
    cats={c['id'] for c in data['categories']}
    if 'registry' in data:
        assert data['registry']['count']==len(ids)
        registry_ids=[u['registry_id'] for u in data['universities']]
        assert len(registry_ids)==len(set(registry_ids))
        for u in data['universities']:
            assert re.fullmatch(r'FI\d{5}',u['registry_id']) and u['institution_type'] in TYPES
            if u.get('official_url'):
                parsed=urlparse(u['official_url']);assert parsed.scheme in ('http','https') and parsed.hostname and not parsed.username
    for s in data['sources'].values():validate_url(s['url']);assert s['institution_title']
    subject_ids=[]
    for uni in data['universities']:
        assert set(uni['overall'])=={'QS','THE','ARWU'}
        for provider,record in uni['overall'].items():
            if record.get('source_id'):assert data['sources'][record['source_id']]['provider']==provider
        if uni['detail_url']:assert re.fullmatch(r'university-[a-z-]+\.html',uni['detail_url'])
    records=[r for u in data['universities'] for r in u['overall'].values()]+data['subjects']
    for r in records:
        assert r['status'] in STATES
        assert isinstance(r['year'],int) and 2000<=r['year']<=2100
        if r['status']=='ranked':
            normalize_rank(r['rank']);assert re.fullmatch(r'\d{4}-\d{2}-\d{2}',r['checked_at'])
            assert r['source_id'] in data['sources']
        elif r['status']=='not_listed':
            assert r.get('evidence_note') and r.get('checked_at') and r.get('source_id') in data['sources']
        else:assert r['rank'] is None
    for r in data['subjects']:
        assert r['status']=='ranked'
        assert r['university_id'] in ids and r['category'] in cats
        assert r['provider'] in ('QS','THE','ARWU')
        subject_ids.append((r['university_id'],r['provider'],r['year'],r['official_subject']))
    assert len(subject_ids)==len(set(subject_ids))
def source_link(data,r,label='公式出典'):
    s=data['sources'].get(r.get('source_id'))
    if not s:return ''
    return f'<a class="rk-source" href="{esc(s["url"])}" target="_blank" rel="noopener noreferrer">{label}<span class="rk-sr">（別タブ）</span> ↗</a>'
def cell(data,r,provider):
    stale=r['year']!=data['target_editions'][provider]
    if r['status']=='ranked':
        title=('参考・過年度 ' if stale else '')+f'{r["year"]}年版'
        html=f'<span class="rk-year{" rk-old" if stale else ""}">{title}</span><strong class="rk-rank">{esc(r["rank"])}<small>位</small></strong>'
        html+=source_link(data,r)+f'<span class="rk-checked">確認 {esc(r["checked_at"])}</span>'
        if r.get('latest_attempt',{}).get('status')=='failed':html+='<span class="rk-old">更新取得失敗・前回値を保持</span>'
        if r.get('latest_attempt',{}).get('status')=='needs_review':html+='<span class="rk-old">版年・対象を再確認中・前回値を保持</span>'
        if stale:html+=f'<span class="rk-checked">{data["target_editions"][provider]}年版は未確認</span>'
        return html
    names={'not_listed':'未掲載','unconfirmed':'未確認','fetch_failed':'取得失敗'}
    return f'<span class="rk-year">{r["year"]}年版</span><span class="rk-status">{names[r["status"]]}</span>'+source_link(data,r)
def university(uni):
    name=f'<strong>{esc(uni["name_ja"])}</strong><span class="rk-en">{esc(uni["name"])}</span><span class="rk-city">{esc(uni["city"])}</span>'
    if uni['detail_url']:name+=f'<a class="rk-source" href="{esc(uni["detail_url"])}">大学紹介・出願情報 →</a>'
    if uni.get('institution_type'):name+=f'<span class="rk-city">{esc(TYPES[uni["institution_type"]])} · {esc(uni["abbreviation"])}</span>'
    if uni.get('official_url'):name+=f'<a class="rk-source" href="{esc(uni["official_url"])}" target="_blank" rel="noopener noreferrer">大学公式サイト ↗</a>'
    if uni.get('note'):name+=f'<span class="rk-checked">{esc(uni["note"])}</span>'
    return name
def overall(data):
    rows=[]
    for u in data['universities']:
        attrs=' '.join(f'data-{p.lower()}="{int(re.search(r"\d+",r["rank"])[0]) if r["status"]=="ranked" and r["year"]==data["target_editions"][p] else 999999}"' for p,r in u['overall'].items())
        rows.append(f'<tr data-overall-row data-type="{esc(u.get("institution_type",""))}" data-ranked="{str(any(r["status"]=="ranked" for r in u["overall"].values())).lower()}" data-search="{esc(u["name_ja"]+" "+u["name"]+" "+u["city"]+" "+u["id"]+" "+u.get("abbreviation","")+" "+u.get("registry_name",""))}" {attrs}><th scope="row">{university(u)}</th>'+''.join('<td>'+cell(data,u['overall'][p],p)+'</td>' for p in ['QS','THE','ARWU'])+'</tr>')
    years=' / '.join(f'{p} {y}年版' for p,y in data['target_editions'].items())
    dates=[r['checked_at'] for u in data['universities'] for r in u['overall'].values() if r['status']=='ranked']
    date_label=min(dates) if len(set(dates))==1 else min(dates)+'〜'+max(dates)
    return f'''<div class="rk-component" data-ranking-overall>
<p class="rk-meta">データ確認日：{date_label} · 掲載 {len(rows)}校</p>
<p class="rk-note">比較対象は {years}。公式プロフィールで過年度の順位のみ確認できた場合は「参考・過年度」として版年を明記しています。</p>
<p class="rk-note">掲載範囲：教育庁の国家認定高等教育機関名簿にある全{len(rows)}校（大学・応用科学大学・カレッジ）。名簿確認日：{data["registry"]["checked_at"]}。<a href="{esc(data["registry"]["url"])}" target="_blank" rel="noopener noreferrer">教育庁の名簿 ↗</a> 外国大学の分校はこの名簿の対象外です。</p>
<div class="rk-controls" data-controls hidden><label>大学名・都市で検索<input type="search" data-university-search placeholder="例：ELTE、セゲド、Budapest" autocomplete="off"></label><label>学校種別<select data-institution-type><option value="all">すべての種別</option><option value="university">大学</option><option value="university of applied sciences">応用科学大学</option><option value="college">カレッジ</option></select></label><label>順位の確認状況<select data-ranking-status><option value="all">すべての学校</option><option value="ranked">総合順位の確認済みあり</option></select></label><label>並び順<select data-ranking-sort><option value="default">掲載順</option>'''+''.join(f'<option value="{p.lower()}">{p} {y}年版の順位順</option>' for p,y in data['target_editions'].items())+f'''</select></label><button type="button" data-reset class="rk-button">条件をリセット</button></div>
<p class="rk-result" data-overall-count role="status" aria-live="polite">{len(rows)}校を表示</p>
<p class="rk-scroll-hint">表は横にスクロールできます。順位を比較するときは、機関と版年をそろえてください。</p>
<div class="rk-table-wrap" role="region" aria-label="総合ランキング比較表" tabindex="0"><table class="rk-table rk-overall"><caption class="rk-sr">ハンガリーの国家認定高等教育機関 QS・THE・ARWU 総合ランキング比較</caption><thead><tr><th scope="col">大学・都市</th><th scope="col">QS<span>World University Rankings</span></th><th scope="col">THE<span>World University Rankings</span></th><th scope="col">ARWU<span>Academic Ranking of World Universities</span></th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<nav class="rk-pagination" data-pagination aria-label="比較表のページ切り替え" hidden><button type="button" class="rk-button" data-page-prev>前へ</button><span data-page-label></span><button type="button" class="rk-button" data-page-next>次へ</button></nav>
<p data-overall-empty class="rk-empty" hidden>条件に一致する大学がありません。大学名や都市名を変えてください。</p>
<details class="rk-legend"><summary>順位の記号と「未掲載・未確認・取得失敗」の違い</summary><dl><dt>=595</dt><dd>同順位の大学がある595位。</dd><dt>501-600 / 1401+</dt><dd>501〜600位の順位帯 / 1401位以下。順位帯の中の順序は決めません。</dd><dt>未掲載</dt><dd>対象機関・対象年の公式資料で、掲載されていないことを確認済み。</dd><dt>未確認</dt><dd>対象年の順位を確認できていない状態。未掲載や教育の質の低さを意味しません。</dd><dt>取得失敗</dt><dd>公式データを取得できなかった状態。確認済みの順位がある場合は、その版年・確認日とともに前回値を保持します。</dd></dl></details>
<p class="rk-note">学校名簿の網羅性と、順位の確認範囲は異なります。未確認の欄に推測の順位は入れていません。名簿掲載は現在の学生募集や英語課程の提供を保証するものではありません。異なる機関の順位を平均した独自順位は作成していません。</p>
</div>'''
def subjects(data):
    universities={u['id']:u for u in data['universities']};rows=[]
    # Keep each official subject/publisher together; do not imply cross-subject ranks are comparable.
    entries=sorted(data['subjects'],key=lambda r:(r['category'],r['official_subject'],r['provider'],int(re.search(r'\d+',r['rank'])[0]),r['university_id']))
    for r in entries:
        u=universities[r['university_id']];p='ShanghaiRanking GRAS' if r['provider']=='ARWU' else r['provider']
        rows.append(f'<tr data-subject-row data-search="{esc(r["subject_ja"]+" "+r["official_subject"]+" "+u["name_ja"]+" "+u["name"])}" data-category="{esc(r["category"])}" data-provider="{esc(r["provider"])}" data-year="{r["year"]}" data-university="{esc(u["id"])}"><th scope="row"><strong>{esc(u["name_ja"])}</strong><span class="rk-city">{esc(u["city"])}</span></th><td><strong>{esc(r["subject_ja"])}</strong><span class="rk-en rk-official">{esc(r["official_subject"])}</span></td><td><span>{esc(p)}</span><span class="rk-year">{r["year"]}年版</span></td><td><strong class="rk-rank">{esc(r["rank"])}<small>位</small></strong></td><td>{source_link(data,r)}<span class="rk-checked">確認 {esc(r["checked_at"])}</span>'+('<span class="rk-old">更新取得失敗・前回値を保持</span>' if r.get('latest_attempt',{}).get('status')=='failed' else '<span class="rk-old">版年・対象を再確認中・前回値を保持</span>' if r.get('latest_attempt',{}).get('status')=='needs_review' else '')+'</td></tr>')
    options=''.join(f'<option value="{esc(c["id"])}"'+'>'+esc(c['label'])+'</option>' for c in data['categories'])
    return f'''<div class="rk-component" data-ranking-subjects data-subject-year="{data['subject_target_year']}">
<p class="rk-note">分野の選択肢は探すための分類です。順位の対象は各行の<strong>公式分野名</strong>です。「Social Sciences」は社会科学全体の評価です。「Sociology（社会学）」や国際関係学単独の順位とは区別してください。</p>
<div class="rk-controls" data-controls hidden><label>分野名・大学名で検索<input type="search" data-subject-search placeholder="例：社会学、Sociology、心理学" autocomplete="off"></label><label>学びたい分野<select data-subject-category><option value="all">すべての分野</option>{options}</select></label><label>ランキング機関<select data-subject-provider><option value="all">すべての機関</option>'''+''.join(f'<option value="{p}">{"ShanghaiRanking GRAS" if p=="ARWU" else p}</option>' for p in sorted({r['provider'] for r in entries}))+'''</select></label><label>大学<select data-subject-university><option value="all">すべての大学</option>'''+''.join(f'<option value="{esc(u["id"])}">{esc(u["name_ja"])}</option>' for u in data['universities'])+f'''</select></label><label>版年<select data-subject-year-filter><option value="all">すべての版年</option>'''+''.join(f'<option value="{year}">{year}年版</option>' for year in sorted({r['year'] for r in entries},reverse=True))+f'''</select></label><button type="button" data-subject-reset class="rk-button">条件をリセット</button></div>
<p class="rk-result" data-subject-count role="status" aria-live="polite">確認済み {len(rows)}件（各行に版年を表示）</p>
<div class="rk-table-wrap" data-subject-table role="region" aria-label="分野別ランキング比較表" tabindex="0"><table class="rk-table rk-subject"><caption class="rk-sr">公式分野名・機関・版年ごとの順位</caption><thead><tr><th scope="col">大学</th><th scope="col">分野名（公式表記）</th><th scope="col">機関・版年</th><th scope="col">順位</th><th scope="col">出典・確認日</th></tr></thead><tbody>{''.join(rows)}</tbody></table></div>
<div class="rk-empty" data-subject-empty hidden><strong>この条件では確認済みデータがありません。</strong><p>未掲載を意味するものではありません。条件を変えるか、公式ランキングと大学のプログラムを確認してください。</p></div>
<div class="rk-empty" data-tourism-note hidden><strong>観光・ホスピタリティは現在未確認です。</strong><p>QSの公式分野名は「Hospitality and Leisure Management」です。経営学全体の順位を観光学の順位として代用していません。</p><a href="https://www.topuniversities.com/university-subject-rankings/hospitality-leisure-management" target="_blank" rel="noopener noreferrer">QSの公式分野別ランキングを見る ↗</a></div>
<p class="rk-note">掲載は公式出典で確認できた順位のみです。QSの分野別順位は、分野と年度をセットで確認できたものから追加します。ShanghaiRankingの分野別ランキングはGRASで、総合ランキングのARWUとは別の評価です。</p>
</div>'''
def replace_block(text,name,content):
    pattern=rf'(<!-- RANKINGS:{name}:START -->).*?(<!-- RANKINGS:{name}:END -->)'
    result,count=re.subn(pattern,lambda m:m[1]+'\n'+content+'\n'+m[2],text,flags=re.S)
    if count!=1:raise ValueError(f'Missing or duplicate {name} marker')
    return result

def build(data,check=False):
    validate(data);outputs={}
    for filename in ['basics-university.html','guide-university-ranking.html']:
        p=ROOT/filename;text=p.read_text();new=replace_block(text,'OVERALL',overall(data))
        if filename.startswith('guide'):new=replace_block(new,'SUBJECTS',subjects(data))
        outputs[p]=new
    # Complete all validation/rendering before touching any file.
    if check:
        for p,new in outputs.items():
            if p.read_text()!=new:raise ValueError(f'{p.name} is out of sync with JSON')
    else:
        for p,new in outputs.items():
            temp=p.with_suffix(p.suffix+'.tmp');temp.write_text(new);temp.replace(p)
    return outputs
if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--check',action='store_true');args=ap.parse_args()
    build(json.loads(DATA.read_text()),args.check);print('Both ranking pages are consistent with the shared dataset.')
