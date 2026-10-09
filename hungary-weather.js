(() => {
  'use strict';
  const select = document.getElementById('weatherCity');
  if (!select) return;
  const nowEl = document.getElementById('weatherNow');
  const status = document.getElementById('weatherStatus');
  const head = document.getElementById('climateHead');
  const rows = document.getElementById('climateRows');
  const chart = document.getElementById('climateChart');
  const meta = document.getElementById('climateMeta');
  let weather, climate;
  const fmt = new Intl.DateTimeFormat('ja-JP', { timeZone:'Europe/Budapest', year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' });
  const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Budapest', year:'numeric', month:'2-digit', day:'2-digit' });
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => typeof n === 'number' && Number.isFinite(n);
  const value = (n, unit='℃') => number(n) ? n.toFixed(1)+unit : '—';
  const date = s => { const d = new Date(s); return Number.isNaN(+d) ? '時刻不明' : fmt.format(d); };
  function condition(symbol) {
    if (symbol.includes('sleet')) return 'みぞれ';
    if (symbol.includes('snow')) return '雪';
    if (symbol.includes('thunder')) return '雷雨';
    if (symbol.includes('rain')) return '雨';
    if (symbol.includes('fog')) return '霧';
    if (symbol.includes('partlycloudy') || symbol.includes('fair')) return '晴れ時々曇り';
    if (symbol.includes('cloudy')) return '曇り';
    if (symbol.includes('clearsky')) return '晴れ';
    return '天候情報なし';
  }
  function renderWeather() {
    const city = weather?.cities?.[select.value];
    if (!city || !Array.isArray(city.hours)) {
      nowEl.textContent = '最新気温を取得できません。公式気象情報をご確認ください。';
      status.textContent = '気温データがありません。'; return;
    }
    const currentTime = Date.now();
    const points = city.hours.filter(p => number(p.temperature) && Number.isFinite(Date.parse(p.time)));
    const point = points.find(p => Date.parse(p.time) >= currentTime - 30*60*1000);
    if (!point || Math.abs(Date.parse(point.time)-currentTime) > 2*60*60*1000) {
      nowEl.textContent = '当日の気温データの更新を待っています。公式気象情報をご確認ください。';
      status.textContent = '最終取得：'+date(city.fetched_at); return;
    }
    const today = dayFmt.format(new Date());
    const day = points.filter(p => dayFmt.format(new Date(p.time)) === today).map(p => p.temperature);
    const stale = currentTime - Date.parse(city.fetched_at) > 3*60*60*1000;
    nowEl.innerHTML = `<p>${esc(city.name)}｜${stale ? '保存された予報' : '現在の気温予報'}</p><p class="weatherTemperature">${value(point.temperature)}</p><div class="weatherStats"><span>${esc(condition(point.symbol || ''))}</span><span>風速 ${value(point.wind_ms,' m/s')}</span><span>湿度 ${value(point.humidity,'%')}</span></div><p>この先、今日の予報範囲：${day.length ? value(Math.min(...day))+'〜'+value(Math.max(...day)) : '—'}</p>`;
    status.textContent = `対象時刻：${date(point.time)}（ハンガリー時間）／取得：${date(city.fetched_at)}${stale ? '／更新が遅れています。' : ''}`;
  }
  function renderClimate() {
    const city = climate?.cities?.[select.value];
    if (!city || !Array.isArray(city.months) || city.months.length !== 12 || !Array.isArray(climate.comparison_years) || climate.comparison_years.length !== 2) {
      rows.innerHTML='<tr><td colspan="7">気候の比較データを取得できません。出典の公式情報をご確認ください。</td></tr>'; chart.replaceChildren(); meta.textContent=''; return;
    }
    const [y1,y2] = climate.comparison_years;
    meta.textContent = `${city.name}｜平年値：${climate.normal_period}／比較：${y1}年・${y2}年／取得：${date(climate.generated_at)}`;
    head.innerHTML=`<tr><th scope="col">月</th><th scope="col">平年平均</th><th scope="col">${y1}年</th><th scope="col">平年差</th><th scope="col">${y2}年</th><th scope="col">平年差</th><th scope="col">平年降水量</th></tr>`;
    const delta = (n,b) => number(n) && number(b) ? (n-b >= 0 ? '+' : '')+(n-b).toFixed(1)+'℃' : '—';
    rows.innerHTML=city.months.map(m => {const a=m.previous_mean?.[y1],b=m.previous_mean?.[y2];return `<tr><th scope="row">${esc(m.month)}月</th><td>${value(m.normal_mean)}</td><td>${value(a)}</td><td>${delta(a,m.normal_mean)}</td><td>${value(b)}</td><td>${delta(b,m.normal_mean)}</td><td>${value(m.normal_precipitation_mm,' mm')}</td></tr>`;}).join('');
    const series=[{name:'平年値',color:'#1d4ed8',values:city.months.map(m=>m.normal_mean)},{name:y1+'年',color:'#c2410c',values:city.months.map(m=>m.previous_mean?.[y1])},{name:y2+'年',color:'#047857',values:city.months.map(m=>m.previous_mean?.[y2])}];
    const all=series.flatMap(s=>s.values).filter(number);
    if(!all.length){chart.replaceChildren();return;}
    const low=Math.floor(Math.min(...all)/5)*5-5, high=Math.ceil(Math.max(...all)/5)*5+5;
    const x=i=>48+i*62, y=v=>260-(v-low)/(high-low)*220;
    let svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 770 310" role="img" aria-labelledby="climateSvgTitle climateSvgDesc"><title id="climateSvgTitle">月平均気温の比較</title><desc id="climateSvgDesc">平年値と過去2年の気温推移。正確な数値は下の表に掲載しています。</desc><rect width="770" height="310" fill="white"/>';
    for(let t=low;t<=high;t+=5)svg+=`<line x1="48" y1="${y(t)}" x2="730" y2="${y(t)}" stroke="#e2e8f0"/><text x="4" y="${y(t)+5}" font-size="13" fill="#475569">${t}℃</text>`;
    for(let i=0;i<12;i++)svg+=`<text x="${x(i)}" y="290" text-anchor="middle" font-size="13" fill="#475569">${i+1}月</text>`;
    for(const s of series){let path='',drawing=false;for(let i=0;i<12;i++){if(number(s.values[i])){path+=(drawing?'L':'M')+x(i)+' '+y(s.values[i])+' ';drawing=true;}else drawing=false;}svg+=`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="3"/>`;}
    svg+='</svg><div class="climateLegend">'+series.map(s=>`<span style="border-color:${s.color}">${esc(s.name)}</span>`).join('')+'</div>';chart.innerHTML=svg;
  }
  async function read(url) {
    const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),15000);
    try { const res=await fetch(url,{cache:'no-store',signal:abort.signal});if(!res.ok)throw Error('HTTP '+res.status);return await res.json(); }
    finally{clearTimeout(timer);}
  }
  async function refresh() {
    const results=await Promise.allSettled([read('data/hungary-weather-current.json'),read('data/hungary-climate.json')]);
    if(results[0].status==='fulfilled')weather=results[0].value;
    if(results[1].status==='fulfilled')climate=results[1].value;
    renderWeather();renderClimate();
    if(results[0].status==='rejected' && weather)status.textContent+='／再取得できないため保存データを表示しています。';
  }
  select.addEventListener('change',()=>{renderWeather();renderClimate();});
  refresh();
  setInterval(()=>{if(document.visibilityState!=='hidden')refresh();},10*60*1000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh();});
})();
