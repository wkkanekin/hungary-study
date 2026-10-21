window.ITALY_UNIVERSITIES = {"checkedOn": "2026-10-21", "cities": [{"id": "polimi", "name": "ミラノ", "state": "ロンバルディア", "lat": 45.478, "lon": 9.228}, {"id": "sapienza", "name": "ローマ", "state": "ラツィオ", "lat": 41.903, "lon": 12.515}, {"id": "bologna", "name": "ボローニャ", "state": "エミリア＝ロマーニャ", "lat": 44.497, "lon": 11.354}, {"id": "padua", "name": "パドヴァ", "state": "ヴェネト", "lat": 45.407, "lon": 11.877}, {"id": "pisa", "name": "ピサ", "state": "トスカーナ", "lat": 43.716, "lon": 10.4}, {"id": "turin", "name": "トリノ", "state": "ピエモンテ", "lat": 45.07, "lon": 7.688}, {"id": "florence", "name": "フィレンツェ", "state": "トスカーナ", "lat": 43.778, "lon": 11.259}, {"id": "venice", "name": "ヴェネツィア", "state": "ヴェネト", "lat": 45.434, "lon": 12.326}], "universities": [{"id": "polimi", "name": "ミラノ工科大学 / Politecnico di Milano", "cityId": "polimi", "sourceUrl": "https://www.polimi.it/en/", "guideUrl": "guide-polimi.html", "studentIds": []}, {"id": "sapienza", "name": "ローマ・サピエンツァ大学 / Sapienza University of Rome", "cityId": "sapienza", "sourceUrl": "https://www.uniroma1.it/en", "guideUrl": "guide-sapienza.html", "studentIds": []}, {"id": "bologna", "name": "ボローニャ大学 / University of Bologna", "cityId": "bologna", "sourceUrl": "https://www.unibo.it/en", "guideUrl": "guide-bologna.html", "studentIds": []}, {"id": "padua", "name": "パドヴァ大学 / University of Padua", "cityId": "padua", "sourceUrl": "https://www.unipd.it/en/", "guideUrl": "guide-padua.html", "studentIds": []}, {"id": "pisa", "name": "ピサ大学 / University of Pisa", "cityId": "pisa", "sourceUrl": "https://www.unipi.it/en/", "guideUrl": "guide-pisa.html", "studentIds": []}, {"id": "turin", "name": "トリノ大学 / University of Turin", "cityId": "turin", "sourceUrl": "https://en.unito.it/", "guideUrl": "guide-turin.html", "studentIds": []}, {"id": "florence", "name": "フィレンツェ大学 / University of Florence", "cityId": "florence", "sourceUrl": "https://www.unifi.it/en", "guideUrl": "guide-florence.html", "studentIds": []}, {"id": "venice", "name": "ヴェネツィア・カフォスカリ大学 / Ca’ Foscari University of Venice", "cityId": "venice", "sourceUrl": "https://www.unive.it/english", "guideUrl": "guide-venice.html", "studentIds": []}]};
window.ITALY_MAP = {bounds:[[35.4,6.3],[47.3,19]],addContext(map){const pane=map.createPane("countryOutline");pane.style.zIndex="410";pane.style.pointerEvents="none";L.geoJSON({"type": "FeatureCollection", "features": [{"type": "Feature", "properties": {"name": "France"}, "geometry": {"type": "MultiPolygon", "coordinates": [[[[-51.657797, 4.156232], [-52.249338, 3.241094], [-52.556425, 2.504705], [-52.939657, 2.124858], [-53.418465, 2.053389], [-53.554839, 2.334897], [-53.778521, 2.376703], [-54.088063, 2.105557], [-54.524754, 2.311849], [-54.269705, 2.732392], [-54.181726, 3.18978], [-54.006931, 3.620038], [-54.399542, 4.212611], [-54.478633, 4.896756], [-53.958045, 5.756548], [-53.618453, 5.646529], [-52.882141, 5.409851], [-51.823343, 4.565768], [-51.657797, 4.156232]]], [[[6.18632, 49.463803], [6.65823, 49.201958], [8.099279, 49.017784], [7.593676, 48.333019], [7.466759, 47.620582], [7.192202, 47.449766], [6.736571, 47.541801], [6.768714, 47.287708], [6.037389, 46.725779], [6.022609, 46.27299], [6.5001, 46.429673], [6.843593, 45.991147], [6.802355, 45.70858], [7.096652, 45.333099], [6.749955, 45.028518], [7.007562, 44.254767], [7.549596, 44.127901], [7.435185, 43.693845], [6.529245, 43.128892], [4.556963, 43.399651], [3.100411, 43.075201], [2.985999, 42.473015], [1.826793, 42.343385], [0.701591, 42.795734], [0.338047, 42.579546], [-1.502771, 43.034014], [-1.901351, 43.422802], [-1.384225, 44.02261], [-1.193798, 46.014918], [-2.225724, 47.064363], [-2.963276, 47.570327], [-4.491555, 47.954954], [-4.59235, 48.68416], [-3.295814, 48.901692], [-1.616511, 48.644421], [-1.933494, 49.776342], [-0.989469, 49.347376], [1.338761, 50.127173], [1.639001, 50.946606], [2.513573, 51.148506], [2.658422, 50.796848], [3.123252, 50.780363], [3.588184, 50.378992], [4.286023, 49.907497], [4.799222, 49.985373], [5.674052, 49.529484], [5.897759, 49.442667], [6.18632, 49.463803]]], [[[8.746009, 42.628122], [9.390001, 43.009985], [9.560016, 42.152492], [9.229752, 41.380007], [8.775723, 41.583612], [8.544213, 42.256517], [8.746009, 42.628122]]]]}}, {"type": "Feature", "properties": {"name": "Austria"}, "geometry": {"type": "Polygon", "coordinates": [[[16.979667, 48.123497], [16.903754, 47.714866], [16.340584, 47.712902], [16.534268, 47.496171], [16.202298, 46.852386], [16.011664, 46.683611], [15.137092, 46.658703], [14.632472, 46.431817], [13.806475, 46.509306], [12.376485, 46.767559], [12.153088, 47.115393], [11.164828, 46.941579], [11.048556, 46.751359], [10.442701, 46.893546], [9.932448, 46.920728], [9.47997, 47.10281], [9.632932, 47.347601], [9.594226, 47.525058], [9.896068, 47.580197], [10.402084, 47.302488], [10.544504, 47.566399], [11.426414, 47.523766], [12.141357, 47.703083], [12.62076, 47.672388], [12.932627, 47.467646], [13.025851, 47.637584], [12.884103, 48.289146], [13.243357, 48.416115], [13.595946, 48.877172], [14.338898, 48.555305], [14.901447, 48.964402], [15.253416, 49.039074], [16.029647, 48.733899], [16.499283, 48.785808], [16.960288, 48.596982], [16.879983, 48.470013], [16.979667, 48.123497]]]}}, {"type": "Feature", "properties": {"name": "Croatia"}, "geometry": {"type": "Polygon", "coordinates": [[[16.564808, 46.503751], [16.882515, 46.380632], [17.630066, 45.951769], [18.456062, 45.759481], [18.829825, 45.908872], [19.072769, 45.521511], [19.390476, 45.236516], [19.005485, 44.860234], [18.553214, 45.08159], [17.861783, 45.06774], [17.002146, 45.233777], [16.534939, 45.211608], [16.318157, 45.004127], [15.959367, 45.233777], [15.750026, 44.818712], [16.23966, 44.351143], [16.456443, 44.04124], [16.916156, 43.667722], [17.297373, 43.446341], [17.674922, 43.028563], [18.56, 42.65], [18.450017, 42.479992], [18.450016, 42.479991], [17.50997, 42.849995], [16.930006, 43.209998], [16.015385, 43.507215], [15.174454, 44.243191], [15.37625, 44.317915], [14.920309, 44.738484], [14.901602, 45.07606], [14.258748, 45.233777], [13.952255, 44.802124], [13.656976, 45.136935], [13.679403, 45.484149], [13.71506, 45.500324], [14.411968, 45.466166], [14.595109, 45.634941], [14.935244, 45.471695], [15.327675, 45.452316], [15.323954, 45.731783], [15.67153, 45.834154], [15.768733, 46.238108], [16.564808, 46.503751]]]}}, {"type": "Feature", "properties": {"name": "Switzerland"}, "geometry": {"type": "Polygon", "coordinates": [[[9.594226, 47.525058], [9.632932, 47.347601], [9.47997, 47.10281], [9.932448, 46.920728], [10.442701, 46.893546], [10.363378, 46.483571], [9.922837, 46.314899], [9.182882, 46.440215], [8.966306, 46.036932], [8.489952, 46.005151], [8.31663, 46.163642], [7.755992, 45.82449], [7.273851, 45.776948], [6.843593, 45.991147], [6.5001, 46.429673], [6.022609, 46.27299], [6.037389, 46.725779], [6.768714, 47.287708], [6.736571, 47.541801], [7.192202, 47.449766], [7.466759, 47.620582], [8.317301, 47.61358], [8.522612, 47.830828], [9.594226, 47.525058]]]}}, {"type": "Feature", "properties": {"name": "Italy"}, "geometry": {"type": "MultiPolygon", "coordinates": [[[[10.442701, 46.893546], [11.048556, 46.751359], [11.164828, 46.941579], [12.153088, 47.115393], [12.376485, 46.767559], [13.806475, 46.509306], [13.69811, 46.016778], [13.93763, 45.591016], [13.141606, 45.736692], [12.328581, 45.381778], [12.383875, 44.885374], [12.261453, 44.600482], [12.589237, 44.091366], [13.526906, 43.587727], [14.029821, 42.761008], [15.14257, 41.95514], [15.926191, 41.961315], [16.169897, 41.740295], [15.889346, 41.541082], [16.785002, 41.179606], [17.519169, 40.877143], [18.376687, 40.355625], [18.480247, 40.168866], [18.293385, 39.810774], [17.73838, 40.277671], [16.869596, 40.442235], [16.448743, 39.795401], [17.17149, 39.4247], [17.052841, 38.902871], [16.635088, 38.843572], [16.100961, 37.985899], [15.684087, 37.908849], [15.687963, 38.214593], [15.891981, 38.750942], [16.109332, 38.964547], [15.718814, 39.544072], [15.413613, 40.048357], [14.998496, 40.172949], [14.703268, 40.60455], [14.060672, 40.786348], [13.627985, 41.188287], [12.888082, 41.25309], [12.106683, 41.704535], [11.191906, 42.355425], [10.511948, 42.931463], [10.200029, 43.920007], [9.702488, 44.036279], [8.888946, 44.366336], [8.428561, 44.231228], [7.850767, 43.767148], [7.435185, 43.693845], [7.549596, 44.127901], [7.007562, 44.254767], [6.749955, 45.028518], [7.096652, 45.333099], [6.802355, 45.70858], [6.843593, 45.991147], [7.273851, 45.776948], [7.755992, 45.82449], [8.31663, 46.163642], [8.489952, 46.005151], [8.966306, 46.036932], [9.182882, 46.440215], [9.922837, 46.314899], [10.363378, 46.483571], [10.442701, 46.893546]]], [[[14.761249, 38.143874], [15.520376, 38.231155], [15.160243, 37.444046], [15.309898, 37.134219], [15.099988, 36.619987], [14.335229, 36.996631], [13.826733, 37.104531], [12.431004, 37.61295], [12.570944, 38.126381], [13.741156, 38.034966], [14.761249, 38.143874]]], [[[8.709991, 40.899984], [9.210012, 41.209991], [9.809975, 40.500009], [9.669519, 39.177376], [9.214818, 39.240473], [8.806936, 38.906618], [8.428302, 39.171847], [8.388253, 40.378311], [8.159998, 40.950007], [8.709991, 40.899984]]]]}}, {"type": "Feature", "properties": {"name": "Slovenia"}, "geometry": {"type": "Polygon", "coordinates": [[[13.806475, 46.509306], [14.632472, 46.431817], [15.137092, 46.658703], [16.011664, 46.683611], [16.202298, 46.852386], [16.370505, 46.841327], [16.564808, 46.503751], [15.768733, 46.238108], [15.67153, 45.834154], [15.323954, 45.731783], [15.327675, 45.452316], [14.935244, 45.471695], [14.595109, 45.634941], [14.411968, 45.466166], [13.71506, 45.500324], [13.93763, 45.591016], [13.69811, 46.016778], [13.806475, 46.509306]]]}}]},{pane:"countryOutline",interactive:false,style:f=>({color:f.properties.name==="Italy"?"#173b68":"#718096",weight:f.properties.name==="Italy"?3:1,fillColor:"#f7bd42",fillOpacity:f.properties.name==="Italy"?.1:0})}).addTo(map);map.attributionControl.addAttribution('Borders: <a href="https://www.naturalearthdata.com/">Natural Earth</a>');}};
'use strict';
(() => {
  const data = window.ITALY_UNIVERSITIES;
  if (!data) return;
  const $ = id => document.getElementById(id);
  const stateSelect = $('stateSelect'), citySelect = $('citySelect'), search = $('universitySearch');
  const list = $('universityList'), heading = $('universityListTitle'), status = $('studentFilterStatus');
  const cards = [...document.querySelectorAll('.studentCard')];
  const cities = new Map(data.cities.map(c => [c.id, c]));
  const states = [...new Set(data.cities.map(c => c.state))].sort((a,b) => a.localeCompare(b,'it'));
  const universities = data.universities;
  let selectedCity = '', selectedUniversity = '', map, markers = new Map();
  const normal = text => text.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  function option(value, label) { const el=document.createElement('option');el.value=value;el.textContent=label;return el; }
  states.forEach(s => stateSelect.append(option(s,s)));
  $('mapScope').textContent = `イタリアの${universities.length}大学を掲載（2026年10月21日確認）。`;
  function resetStudents() {
    selectedUniversity='';cards.forEach(c => c.hidden=false);
    $('studentRecruitment').hidden=true;
    status.textContent=`仮プロフィール${cards.length}名を表示しています。`;
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
    status.textContent = `${u.name}：${count ? `仮プロフィール${count}名を表示しています。` : '登録学生はまだいません。'}`;
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
      status.textContent=(selectedCity?cities.get(selectedCity).name:'検索条件に合う大学')+'：'+(count?`仮プロフィール${count}名を表示しています。`:'登録学生はまだいません。');
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
    [...cities.values()].filter(c=>!stateSelect.value || c.state===stateSelect.value).sort((a,b)=>a.name.localeCompare(b.name,'it')).forEach(c=>citySelect.append(option(c.id,`${c.name}（${universities.filter(u=>u.cityId===c.id).length}校）`)));
    citySelect.value=selectedCity;
  }
  function updateMarkers() {
    if (!map) return;
    markers.forEach((m,id)=>{ const c=cities.get(id);if(!stateSelect.value || c.state===stateSelect.value)m.addTo(map);else m.remove(); });
    const visible=[...cities.values()].filter(c=>!stateSelect.value || c.state===stateSelect.value);
    if (!stateSelect.value) {map.fitBounds(window.ITALY_MAP?.bounds || [[46.55,4.8],[55.35,16.3]],{padding:[12,12]});return;}
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
    map=L.map('italyMap',{scrollWheelZoom:false,minZoom:3,maxZoom:12});
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'}).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    window.ITALY_MAP?.addContext(map);
    cities.forEach(c=>{
      const studentCount=new Set(universities.filter(u=>u.cityId===c.id).flatMap(u=>u.studentIds)).size;
      const hasStudents=studentCount>0;
      const label=c.name+(hasStudents?` · 仮プロフィール${studentCount}名`:'');
      const m=L.marker([c.lat,c.lon],{title:label,alt:label,zIndexOffset:hasStudents?1000:0,icon:L.divIcon({className:'cityMarker'+(hasStudents?' hasStudents':''),html:hasStudents?'<span aria-hidden="true">'+studentCount+'</span>':'',iconSize:hasStudents?[24,24]:[10,10],iconAnchor:hasStudents?[12,12]:[5,5]})});
      m.bindTooltip(label,{direction:'top',permanent:hasStudents,offset:[0,-12],className:hasStudents?'studentCityLabel':''});m.on('click',()=>selectCity(c.id));markers.set(c.id,m);
    });
    updateMarkers();
  } else $('italyMap').textContent='地図を読み込めませんでした。都市メニューから大学を選べます。';
  updateCityOptions();renderList();resetStudents();
})();

