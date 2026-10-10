"""Keep the readable HTML cost table in sync with the saved Numbeo data."""
import argparse
import json
import math
import re
from datetime import datetime
from html import escape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
METRICS = ('cost_of_living_index', 'rent_index', 'restaurant_price_index')


def render(data):
    cities = data['cities']
    if not cities:
        raise ValueError('No saved cities; preserve the previous HTML snapshot')
    date = datetime.fromisoformat(data['updated_at']).date().isoformat()
    rows = []
    for city in cities:
        values = []
        for metric in METRICS:
            value = city.get(metric)
            if not isinstance(value, (float, int)) or not math.isfinite(value) or value < 0:
                raise ValueError(f'Invalid {metric} for {city.get("city")}')
            values.append(f'<td>{value:.1f}</td>')
        label = escape(city.get('label_ja') or city['city'])
        rows.append(f'<tr><th scope="row">{label}</th>{"".join(values)}</tr>')
    return f'''<section class="seo-snapshot">
<h2 id="cost-comparison-table">都市別の物価比較表</h2>
<p id="metaText">データ取得日：{date} / 取得元：Numbeo / 基準：New York = 100</p>
<p class="seo-data-note">取得日当時の保存済みデータです。現在の店頭価格や家賃を示すものではありません。更新データを取得できない場合も、この表は読めます。</p>
<div class="tableWrap"><table><caption>日本・ハンガリーの主要都市の相対的な価格指数</caption><thead><tr><th scope="col">都市</th><th scope="col">生活費（家賃除く）</th><th scope="col">家賃</th><th scope="col">外食</th></tr></thead><tbody id="compareTableBody">{''.join(rows)}</tbody></table></div>
<p><a href="https://www.numbeo.com/cost-of-living/rankings_current.jsp" target="_blank" rel="noopener">出典：Numbeoの都市別ランキング</a>。指数は金額ではなく、基準都市に対する相対値です。</p>
</section>'''


def build(check=False):
    data = json.loads((ROOT / 'cost_compare_numbeo.json').read_text())
    page = ROOT / 'guide-hungary-cost-compare.html'
    raw = page.read_bytes()
    text = page.read_text()
    pattern = r'(<!-- COST_COMPARE:START -->).*?(<!-- COST_COMPARE:END -->)'
    result, count = re.subn(pattern, lambda m: m[1] + '\n' + render(data) + '\n' + m[2], text, flags=re.S)
    if count != 1:
        raise ValueError('Missing or duplicate cost snapshot markers')
    if check:
        if result != text:
            raise ValueError('Cost comparison HTML is out of sync with saved JSON')
    elif result != text:
        newline = '\r\n' if b'\r\n' in raw else '\n'
        temp = page.with_suffix('.html.tmp')
        temp.write_bytes(result.replace('\n', newline).encode('utf-8'))
        temp.replace(page)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--check', action='store_true')
    build(parser.parse_args().check)
    print('Cost comparison HTML matches saved data.')
