'use strict';
(() => {
  const data = window.GERMANY_UNIVERSITIES;
  if (!data) return;
  const $ = id => document.getElementById(id);
  const stateSelect = $('stateSelect'), citySelect = $('citySelect'), search = $('universitySearch');
  const list = $('universityList'), heading = $('universityListTitle'), status = $('studentFilterStatus');
  const cards = [...document.querySelectorAll('.studentCard')];
  const cities = new Map(data.cities.map(c => [c.id, c]));
  const states = [...new Set(data.cities.map(c => c.state))].sort((a,b) => a.localeCompare(b,'de'));
  const universities = data.universities;
  let selectedCity = '', selectedUniversity = '', map, markers = new Map();
  const normal = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function option(value, label) { const el=document.createElement('option');el.value=value;el.textContent=label;return el; }
  states.forEach(s => stateSelect.append(option(s,s)));
  $('mapScope').textContent = `16州・${universities.length}校・${cities.size}都市を収録（2026年10月1日確認）。全大学・全キャンパスの一覧ではありません。`;
  function resetStudents() {
    selectedUniversity='';cards.forEach(c => c.hidden=false);
    status.textContent='共同運営者・現役学生3名を表示しています。';
    $('clearStudentFilter').hidden=true;
    list.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed','false'));
  }
  function filterStudents(u) {
    selectedUniversity=u.id;
    cards.forEach(c => c.hidden=!u.studentIds.includes(c.id.replace('student-','')));
    const count=cards.filter(c=>!c.hidden).length;
    status.textContent = `${u.name}：${count ? `登録学生${count}名を表示しています。` : '登録学生はまだいません。'}`;
    $('clearStudentFilter').hidden=false;
    list.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed',String(b.dataset.university===u.id)));
    $('students').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    status.focus({preventScroll:true});
  }
  function renderList() {
    list.replaceChildren();
    const query=normal(search.value.trim());
    const filtered=universities.filter(u => (!stateSelect.value || cities.get(u.cityId).state===stateSelect.value) && (!selectedCity || u.cityId===selectedCity) && (!query || normal(u.name+' '+cities.get(u.cityId).name).includes(query)));
    heading.textContent=selectedCity ? `${cities.get(selectedCity).name} の大学（${filtered.length}校）` : query ? `検索結果（${filtered.length}校）` : '都市を選んで大学を探す';
    if (!selectedCity && !query) {const p=document.createElement('p');p.className='mapHint';p.textContent='地図の点、または都市のメニューから選んでください。大学名での検索もできます。';list.append(p);return;}
    if (!filtered.length) {const p=document.createElement('p');p.className='mapHint';p.textContent='収録データ内に該当する大学がありません。検索条件を変更してください。';list.append(p);}
    filtered.forEach(u=>{
      const row=document.createElement('div');row.className='universityRow';
      const b=document.createElement('button');b.type='button';b.className='uniBtn';b.dataset.university=u.id;b.setAttribute('aria-pressed',String(selectedUniversity===u.id));
      const title=document.createElement('span');title.className='uniName';title.textContent=u.name;
      const meta=document.createElement('span');meta.className='uniMeta';meta.textContent=`${cities.get(u.cityId).name} · 登録学生${u.studentIds.length}名`;
      b.append(title,meta);b.addEventListener('click',()=>filterStudents(u));
      const source=document.createElement('a');source.className='officialSource';source.href=u.sourceUrl;source.target='_blank';source.rel='noopener noreferrer';source.textContent=`公式出典 ↗`;source.setAttribute('aria-label',`${u.name}の公式出典（新しいタブで開く）`);
      row.append(b,source);list.append(row);
    });
  }
  function updateCityOptions() {
    citySelect.replaceChildren(option('','都市を選択'));
    [...cities.values()].filter(c=>!stateSelect.value || c.state===stateSelect.value).sort((a,b)=>a.name.localeCompare(b.name,'de')).forEach(c=>citySelect.append(option(c.id,`${c.name}（${universities.filter(u=>u.cityId===c.id).length}校）`)));
    citySelect.value=selectedCity;
  }
  function updateMarkers() {
    if (!map) return;
    markers.forEach((m,id)=>{ const c=cities.get(id);if(!stateSelect.value || c.state===stateSelect.value)m.addTo(map);else m.remove(); });
    const visible=[...cities.values()].filter(c=>!stateSelect.value || c.state===stateSelect.value);
    if (visible.length>1)map.fitBounds(visible.map(c=>[c.lat,c.lon]),{padding:[28,28],maxZoom:7});
    else if(visible.length)map.setView([visible[0].lat,visible[0].lon],8);
  }
  function selectCity(id) {
    selectedCity=id;search.value='';citySelect.value=id;resetStudents();renderList();
    if(map && id) {const c=cities.get(id);markers.get(id).openTooltip();map.panTo([c.lat,c.lon]);}
  }
  stateSelect.addEventListener('change',()=>{selectedCity='';search.value='';resetStudents();updateCityOptions();updateMarkers();renderList();});
  citySelect.addEventListener('change',()=>selectCity(citySelect.value));
  search.addEventListener('input',()=>{selectedCity='';citySelect.value='';resetStudents();renderList();});
  $('clearStudentFilter').addEventListener('click',resetStudents);
  $('resetMap').addEventListener('click',()=>{stateSelect.value='';selectedCity='';search.value='';resetStudents();updateCityOptions();updateMarkers();renderList();});
  if (window.L) {
    map=L.map('germanyMap',{scrollWheelZoom:false,minZoom:4,maxZoom:9});
    L.imageOverlay('images/germany-states-bkg.png',[[47,5.4],[55.3,15.6]],{alt:'BKG公式のドイツ州境界地図'}).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    map.attributionControl.addAttribution('© <a href="https://www.bkg.bund.de">BKG</a> 2026 · <a href="https://www.govdata.de/dl-de/by-2-0">dl-de/by-2-0</a>');
    cities.forEach(c=>{
      const hasStudents=universities.some(u=>u.cityId===c.id && u.studentIds.length);
      const m=L.marker([c.lat,c.lon],{title:`${c.name} の大学一覧`,alt:`${c.name} の大学一覧`,icon:L.divIcon({className:'cityMarker'+(hasStudents?' hasStudents':''),html:'',iconSize:[15,15],iconAnchor:[7,7]})});
      m.bindTooltip(c.name,{direction:'top'});m.on('click',()=>selectCity(c.id));markers.set(c.id,m);
    });
    updateMarkers();
  } else $('germanyMap').textContent='地図を読み込めませんでした。都市メニューから大学を選べます。';
  updateCityOptions();renderList();resetStudents();
})();
