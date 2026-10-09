/* Map content has an accessible static location list if JavaScript or tiles fail. */
(() => {
  'use strict';
  const target = document.getElementById('guide-location-map');
  if (!target) return;
  const fallback = target.querySelector('.guideMapFallback');
  if (!window.L) {
    if (fallback) fallback.textContent = '地図を表示できません。下の所在地リンクから地図を開いてください。';
    return;
  }
  try {
    const points = JSON.parse(target.dataset.locations);
    const primary = points.find(p => p.primary) || points[0];
    const map = L.map(target, {scrollWheelZoom:false, tap:false});
    const markerPane=map.createPane('guideMarkers'); markerPane.style.zIndex='450';
    const countryBounds = window.GERMANY_MAP?.bounds || [[46.55,4.8],[55.35,16.3]];
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19,
      attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    map.attributionControl.setPrefix('<a href="https://leafletjs.com/">Leaflet</a>');
    window.GERMANY_MAP?.addContext(map);
    for (const p of points) {
      const marker = L.circleMarker([p.lat,p.lon], {
        pane:'guideMarkers', radius:p.primary ? 10 : 7, color:'#173b68', weight:3,
        fillColor:p.primary ? '#f7bd42' : '#ffffff', fillOpacity:1
      }).addTo(map);
      const label = document.createElement('span');
      label.textContent = p.label;
      marker.bindTooltip(label,{permanent:!!p.primary,direction:'top',offset:[0,-12]});
      const popup = document.createElement('p');
      popup.textContent = p.label;
      marker.bindPopup(popup);
    }
    const buttons = document.querySelectorAll('[data-map-view]');
    const update = view => {
      if (view === 'country') map.fitBounds(countryBounds,{padding:[20,20]});
      else if (points.length === 1) map.setView([primary.lat,primary.lon],11);
      else map.fitBounds(points.map(p=>[p.lat,p.lon]),{padding:[55,55],maxZoom:11});
      buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapView===view)));
    };
    buttons.forEach(b=>b.addEventListener('click',()=>update(b.dataset.mapView)));
    if (fallback) fallback.remove();
    update('country');
    if ('ResizeObserver' in window) new ResizeObserver(()=>map.invalidateSize()).observe(target);
  } catch (_) {
    if (fallback) fallback.textContent = '地図を表示できません。下の所在地リンクをご利用ください。';
  }
})();
