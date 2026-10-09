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
    $('studentRecruitment').hidden=true;
    status.textContent=`現役学生${cards.length}名を表示しています。`;
    $('clearStudentFilter').hidden=true;
    list.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed','false'));
  }
  function filterStudents(u) {
    selectedUniversity=u.id;
    cards.forEach(c => c.hidden=!u.studentIds.includes(c.id.replace('student-','')));
    const count=cards.filter(c=>!c.hidden).length;
    $('studentRecruitment').hidden=count>0;
    $('recruitUniversity').textContent=u.name;
    $('studentRecruitment').dataset.university=u.name;
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
    if (!selectedUniversity && (selectedCity || query)) {
      const ids=new Set(filtered.flatMap(u=>u.studentIds));
      cards.forEach(c=>c.hidden=!ids.has(c.id.replace('student-','')));
      const count=cards.filter(c=>!c.hidden).length;
      status.textContent=(selectedCity?cities.get(selectedCity).name:'検索条件に合う大学')+'：'+(count?`登録学生${count}名を表示しています。`:'登録学生はまだいません。');
      $('clearStudentFilter').hidden=false;
      $('studentRecruitment').hidden=count>0;
      $('recruitUniversity').textContent=selectedCity?cities.get(selectedCity).name+'エリアの大学':'検索条件に合う大学';
      $('studentRecruitment').dataset.university='';
    }
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
      row.append(b,source);if(u.guideUrl){const guide=document.createElement('a');guide.className='officialSource';guide.href=u.guideUrl;guide.textContent='大学ガイドを読む';row.append(guide);}list.append(row);
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
    if (!stateSelect.value) {map.fitBounds(window.GERMANY_MAP?.bounds || [[46.55,4.8],[55.35,16.3]],{padding:[12,12]});return;}
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
    map=L.map('germanyMap',{scrollWheelZoom:false,minZoom:3,maxZoom:12});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    window.GERMANY_MAP?.addContext(map);
    cities.forEach(c=>{
      const studentCount=new Set(universities.filter(u=>u.cityId===c.id).flatMap(u=>u.studentIds)).size;
      const hasStudents=studentCount>0;
      const label=c.name+(hasStudents?` · 登録学生${studentCount}名`:'');
      const m=L.marker([c.lat,c.lon],{title:label,alt:label,zIndexOffset:hasStudents?1000:0,icon:L.divIcon({className:'cityMarker'+(hasStudents?' hasStudents':''),html:hasStudents?'<span aria-hidden="true">'+studentCount+'</span>':'',iconSize:hasStudents?[24,24]:[10,10],iconAnchor:hasStudents?[12,12]:[5,5]})});
      m.bindTooltip(label,{direction:'top',permanent:hasStudents,offset:[0,-12],className:hasStudents?'studentCityLabel':''});m.on('click',()=>selectCity(c.id));markers.set(c.id,m);
    });
    updateMarkers();
  } else $('germanyMap').textContent='地図を読み込めませんでした。都市メニューから大学を選べます。';
  updateCityOptions();renderList();resetStudents();
})();

