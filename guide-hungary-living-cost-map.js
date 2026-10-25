/* Detailed raster maps: no WebGL and no prefetching/offline tile downloads. */
(() => {
  'use strict';
  const cities = [
    ['ブダペスト',47.4979,19.0402], ['デブレツェン',47.5316,21.6273],
    ['ジェール',47.6875,17.6504], ['ミシュコルツ',48.1035,20.7784],
    ['ペーチ',46.0727,18.2323], ['セゲド',46.253,20.1414]
  ];
  const targets = document.querySelectorAll('[data-living-map]');
  if (!window.L) return;
  const start = el => {
    if (el.dataset.initialized) return;
    el.dataset.initialized = 'true';
    const overview = el.dataset.livingMap === 'country';
    const lat = Number(el.dataset.lat), lon = Number(el.dataset.lon);
    const map = L.map(el, {scrollWheelZoom:false, zoomControl:true, attributionControl:true});
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom:19, attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const points = overview ? cities : [[el.dataset.label,lat,lon]];
    points.forEach(([label,y,x]) => {
      const marker=L.circleMarker([y,x],{radius:8,color:'#fff',weight:3,fillColor:'#1d4ed8',fillOpacity:1}).addTo(map);
      const name=document.createElement('span'); name.textContent=label;
      marker.bindTooltip(name,{permanent:true,direction:'top',offset:[0,-8],className:'living-map-label'});
    });
    const country = () => map.fitBounds([[45.65,16.05],[48.65,22.95]],{padding:[18,18]});
    if (overview) country(); else map.setView([lat,lon],11);
    const controls=el.parentElement.querySelector('.living-map-controls');
    controls?.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.view==='country') country(); else map.setView([lat,lon],11);
      controls.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
    }));
    if ('ResizeObserver' in window) new ResizeObserver(()=>map.invalidateSize()).observe(el);
  };
  if ('IntersectionObserver' in window) {
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){start(entry.target);observer.unobserve(entry.target);}
    }),{rootMargin:'100px'});
    targets.forEach(el=>observer.observe(el));
  } else targets.forEach(start);
})();
