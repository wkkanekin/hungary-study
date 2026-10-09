"""Render sourced guide details as static, accessible HTML."""
from html import escape
import json
from currency_display import convert, RATE, DATE, SOURCE
e=lambda x:escape(str(x),quote=True)
def section(title,text,id=None):return '<section'+(' id="'+e(id)+'"' if id else '')+'><h2>'+e(title)+'</h2><p>'+e(text)+'</p></section>'
def link(url,label):return '<a href="'+e(url)+'" target="_blank" rel="noopener noreferrer">'+e(label)+' ↗</a>'
def table(headers,rows,caption):
 rows=[[convert(v) for v in row] for row in rows]
 return '<div class="guideTableWrap" role="region" aria-label="'+e(caption)+'" tabindex="0"><table class="guideTable"><caption>'+e(caption)+'</caption><thead><tr>'+''.join('<th scope="col">'+e(h)+'</th>' for h in headers)+'</tr></thead><tbody>'+''.join('<tr>'+''.join(('<th scope="row">' if i==0 else '<td>')+e(v)+('</th>' if i==0 else '</td>') for i,v in enumerate(row))+'</tr>' for row in rows)+'</tbody></table></div>'
def sources(items):return '<p class="guideSources">出典：'+ ' / '.join(link(url,label) for label,url in items)+'</p>'
def photo(p):
 return '<figure class="campusPhoto"><img src="'+e(p['src'])+'" alt="'+e(p['caption'])+'" width="1200" height="800" decoding="async"/><figcaption>'+e(p['caption'])+'<br/>写真：'+e(p['author'])+' / '+link(p['source'],'画像の出典')+' / '+(link(p['licenseUrl'],p['license']) if p.get('licenseUrl') else e(p['license']))+'</figcaption></figure>'
def render(g):
 d=g['detail'];locations=d['locations'];assert locations and sum(bool(p['primary']) for p in locations)==1
 for p in locations:assert 45<p['lat']<56 and 5<p['lon']<16
 body=photo(g['photo'])+'<dl class="guideFacts"><dt>大学</dt><dd>'+e(g['name'])+'</dd><dt>地域</dt><dd>'+e(g['city'])+'</dd><dt>情報確認日</dt><dd>'+e(g['checkedOn'])+'</dd></dl>'
 body+='<nav class="guideContents" aria-label="ガイドの目次">'+''.join('<a href="#'+id+'">'+label+'</a>' for id,label in [('location','所在地・地図'),('admission','入学条件・入試'),('application-flow','入学フロー'),('fees','授業料・納付金'),('living-costs','生活費・家賃'),('price-trend','物価の推移')])+'</nav>'
 body+='<section id="location"><h2>ドイツのどこにある大学？</h2><p>'+e(d['locationNote'])+'</p><div class="guideMapControls"><button type="button" class="btn whiteBtn" data-map-view="country" aria-pressed="true">ドイツ・周辺国を見る</button><button type="button" class="btn whiteBtn" data-map-view="local" aria-pressed="false">大学のある地域へ拡大</button></div><div id="guide-location-map" class="guideLocationMap" role="region" aria-label="大学の所在地と周辺国の地図" data-locations="'+e(json.dumps(locations,ensure_ascii=False))+'"><p class="guideMapFallback">地図を読み込み中です。下の所在地リンクからも地図を開けます。</p></div><ul class="guideLocationList">'+''.join('<li>'+link('https://www.openstreetmap.org/?mlat='+str(p['lat'])+'&mlon='+str(p['lon'])+'#map=13/'+str(p['lat'])+'/'+str(p['lon']),p['label'])+'</li>' for p in locations)+'</ul><p class="guideNote">マーカーはキャンパス周辺または所在都市の位置です。建物の入口・授業の教室は大学の公式案内で確認してください。濃い青の枠線がドイツの国境です。国境はNatural Earthの概略データ。隣接国との位置関係を示し、地域へ拡大すると概略の国境線は非表示になります。</p></section>'
 body+=section('このガイドで紹介する課程',d['scope'])
 body+='<section id="admission"><h2>入学条件・入試の内容</h2><h3>必要な資格・語学</h3><p>'+e(d['requirements'])+'</p><h3>試験・面接・書類選考</h3><p>'+e(d['exam'])+'</p><h3>出願の時期</h3><p>'+e(d['deadline'])+'</p></section>'
 body+='<section id="application-flow"><h2>いつ何を準備する？ 出願から入学まで</h2><p>'+e(d['scheduleNote'])+'</p>'+table(['時期','準備・手続き'],d['schedule'],'準備の開始時期と出願・選考・入学の時期')+sources(d['scheduleSources'])+'<ol class="guideAdmissionFlow">'+''.join('<li><strong class="guideStepTime">'+e(t)+'</strong>'+e(s)+'</li>' for t,s in zip(d['stepTiming'],d['steps']))+'</ol><p class="guideNote">合格通知だけでは入学登録は完了しません。通知にある登録期限・追加書類・支払い条件まで確認します。</p></section>'
 body+='<section id="fees"><h2>授業料・学期納付金</h2>'+table(['費用の種類','金額・目安','対象・確認事項'],d['fees'],'授業料とその他の納付金を分けて確認')+'<p class="guideNote">円の目安は1ユーロ＝177.34円（ECB・2026年10月9日）で計算し、10円または100円単位に丸めています。実際の決済・送金額は為替や手数料で変わります。免除・課程・入学年度で費用も異なります。生活費・出願審査費・入居初期費用も含めた予算を作ります。</p></section>'
 body+='<section id="living-costs"><h2>その地域の生活費・家賃</h2><p>'+e(convert(d['monthly']))+'</p>'
 if d['rent']:
  r=d['rent'];rows=[[str(year)+'年版','€'+str(flat),'€'+str(wg),('↑ 上昇 +' if change>0 else '↓ 下落 ')+str(change)+'％'] for year,flat,wg,change in r['rows']]
  body+='<h3>'+e(r['city'])+'の学生向け家賃</h3>'+table(['レポート年','30㎡住宅／月','20㎡WG／月','調整済み家賃の前年比'],rows,'MLP・IW 学生住宅レポート：モデルWarmmieteと学生住宅価格指数')+'<p class="guideTrendSummary">'+e(r['summary'])+'</p><p class="guideNote">月額はモデル住宅のWarmmiete（暖房等の付帯費用を含む計算値）。学生寮の料金ではありません。前年比は質・立地を調整した募集純家賃の指数で、モデル月額の増減率とは別です。2026年版は2026年上半期と2025年上半期を比較。年ごとに推計されるモデル月額だけから、市場の上昇・下落を判断しないでください。</p>'+sources([s for s in d['sources'] if '学生住宅レポート' in s[0]])
 if d.get('customRent'):
  r=d['customRent'];body+='<h3>'+e(r['heading'])+'</h3>'+table(r['headers'],r['rows'],r['heading'])+'<p class="guideTrendSummary">'+e(r['text'])+'</p>'+sources([s for s in d['sources'] if '市：' in s[0]])
 body+='<h3>自分の月額予算に入れるもの</h3><p>家賃・光熱費、食費、健康保険、交通費、通信費、教材と日用品。生活費目安に含まれる項目を再度足さないようにし、授業料と学期納付金は別に整理します。敷金・家具・渡航費は毎月の支出と分けて確保します。</p></section>'
 v=d['inflation'];body+='<section id="price-trend"><h2>物価は上がっている？ 下がっている？</h2><p>'+e(v['name'])+'の消費者物価指数（VPI）の年間平均・前年比です。家賃を含む一般世帯の物価の動きを示します。</p>'+table(['年','物価の前年比','価格水準の動き'],[[str(2023+i)+'年','+'+str(rate)+'％','↑ 上昇'] for i,rate in enumerate(v['rates'])],v['name']+'の物価推移（2023〜2025年）')+'<div class="guidePriceBars" aria-hidden="true">'+''.join('<div><span>'+str(2023+i)+'</span><i style="width:'+str(rate/7*65)+'%"></i><b>+'+str(rate)+'%</b></div>' for i,rate in enumerate(v['rates']))+'</div><p class="guideTrendSummary">物価水準は3年とも上昇しています。上昇率が小さくなる年も、価格が下がったという意味ではありません。</p><p class="guideNote">都市単独の統計ではなく、所在する州の指標です。2026年は通年の結果が未確定なので、この表には混ぜていません。学生個人の支出や個別商品の値上がりとは異なります。</p>'+sources(v['sources'])+'</section>'
 if g.get('student'):body+='<a class="btn primary" href="index.html#student-'+e(g['student'])+'">この大学の現役生を見る</a>'
 body+='<section class="sourceList"><h2>公式情報・統計の出典</h2><ul>'+''.join('<li>'+link(url,label)+'</li>' for label,url in g['links'])+'</ul><p>確認日：'+e(g['checkedOn'])+'。上記は全課程の条件ではありません。出願する年度・課程・国籍に対応する最新の募集要項と費用表を確認してください。</p></section><div class="sectionActions"><a class="btn whiteBtn" href="universities.html">大学一覧へ</a><a class="btn primary" href="index.html#students">現役生に相談する</a></div>'
 return body
