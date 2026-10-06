#!/usr/bin/env python3
"""Python 3 / no packages. Regenerate profile HTML and local JS data from JSON."""
from pathlib import Path
from html import escape
import json, re
ROOT = Path(__file__).resolve().parents[1] / 'germany'
e = lambda value: escape(str(value), quote=True)

def profile(p):
    rows = [('大学',p['university']),('地域',p.get('region')),('学年',p.get('year')),('大学区分',p.get('type')),('現在の語学',p.get('currentLanguage')),('使用教材',p.get('learning')),('専攻',p['major']),('入学',p['entry']),('授業言語',p['language']),('合格時語学',p['admission']),('選考形式',p['selection']),('準備期間',p.get('preparation')),('経歴',p['education']),('社会人経験',p.get('work')),('奨学金',p.get('scholarship'))]
    meta = ''.join(f'<div class="metaRow"><dt class="metaK">{e(k)}</dt><dd class="metaV">{e(v)}</dd></div>' for k,v in rows if v)
    tags = ''.join(f'<span class="tag">{e(t)}</span>' for t in p['tags'])
    links = ''.join(f'<a class="linkPill" href="{e(url)}" target="_blank" rel="noopener noreferrer">{e(label)} ↗</a>' for label,url in p['links'])
    return f'''<article class="studentCard" id="student-{e(p['id'])}" tabindex="-1" aria-labelledby="name-{e(p['id'])}">
<div class="studentTop"><div class="avatar"><img src="images/{e(p['photo'])}" alt="{e(p['name'])}の写真" width="112" height="112" loading="lazy"></div><div><span class="operatorBadge">{e(p.get('role','現役学生'))}</span><h3 class="studentName" id="name-{e(p['id'])}">{e(p['name'])}</h3><p class="profileUniversity">{e(p['university'])}<br>{e(p['major'])}</p></div></div>
<dl class="metaBox">{meta}</dl><div class="profileText"><h4>プロフィール</h4><p>{e(p['bio'])}</p><h4>留学のきっかけ</h4><p>{e(p['motivation'])}</p><h4>相談できる内容</h4><div class="tags">{tags}</div><h4>本人からのメッセージ</h4><p>{e(p['message'])}</p></div>
<div class="linkList" aria-label="{e(p['name'])}の関連リンク">{links}</div><div class="studentActions"><a class="btn primary" data-zoom-student="{e(p['id'])}" href="zoom-consult.html?student={e(p['id'])}">Zoomで相談する<span class="srOnly">：{e(p['name'])}</span></a><a class="btn lineConsultBtn" href="arrival-support.html?student={e(p['id'])}">LINEで相談する<span class="srOnly">：{e(p['name'])}</span></a></div><p class="consultStatus" data-booking-status="{e(p['id'])}">Zoom予約受付は準備中です。</p></article>'''

students = json.loads((ROOT/'students.json').read_text(encoding='utf-8'))
columns = json.loads((ROOT/'columns.json').read_text(encoding='utf-8'))
assert len({s['id'] for s in students}) == len(students), 'Student IDs must be unique'
assert len({c['id'] for c in columns}) == len(columns), 'Column IDs must be unique'
for c in columns:
    if c.get('enabled') is not True:
        continue
    assert c['authorId'] in {s['id'] for s in students}, 'Unknown column authorId'
    assert re.fullmatch(r'\d{4}-\d{2}-\d{2}', c['date']), 'Use YYYY-MM-DD for column dates'
    for key in ('url','thumbnail'):
        assert re.fullmatch(r'[a-zA-Z0-9_./-]+',c[key]) and '..' not in c[key], 'Use local relative paths'
        assert (ROOT/c[key]).is_file(), 'Missing column article or thumbnail: '+c[key]
for filename, variable, data in [('students.js','GERMANY_STUDENTS',students),('columns.js','GERMANY_COLUMNS',columns)]:
    (ROOT/'data'/filename).write_text('window.'+variable+' = '+json.dumps(data,ensure_ascii=False,indent=2)+';\n',encoding='utf-8')
index = ROOT/'index.html'
html = index.read_text(encoding='utf-8')
replacement = '<!-- STUDENTS_START -->\n'+ '\n'.join(profile(p) for p in students if p.get('enabled',True)) +'\n<!-- STUDENTS_END -->'
html, count = re.subn(r'<!-- STUDENTS_START -->.*?<!-- STUDENTS_END -->',lambda _:replacement,html,flags=re.S)
assert count == 1, 'Keep the STUDENTS_START/END comments in index.html'
index.write_text(html,encoding='utf-8')
print('Updated profiles, students.js and columns.js. Upload these files with the JSON files.')

updates = json.loads((ROOT/"updates.json").read_text(encoding="utf-8"))
(ROOT/"data/updates.js").write_text("window.GERMANY_UPDATES = "+json.dumps(updates,ensure_ascii=False)+";\n",encoding="utf-8")

# Build reviewed guide pages and merge their entries into site updates.
import runpy
runpy.run_path(str(Path(__file__).with_name("build-guides.py")), run_name="__main__")
