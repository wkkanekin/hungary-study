/* Shared Germany overview. The national outline is generalized, not a campus boundary. */
window.GERMANY_MAP = {
  bounds: [[46.55,4.8],[55.35,16.3]],
  addContext(map) {
    const borders = window.GERMANY_NEIGHBORS;
    if (!borders || !window.L) return;
    const pane = map.createPane('countryOutline'); pane.style.zIndex = '410'; pane.style.pointerEvents = 'none';
    const outline = L.geoJSON(borders, {pane:'countryOutline', interactive:false,
      filter:f=>f.properties.name==='Germany',
      style:{color:'#173b68',weight:4,fillColor:'#f7bd42',fillOpacity:0.14,lineJoin:'round'}
    }).addTo(map);
    const labels = L.layerGroup();
    const points = [['ドイツ',51.25,10.4,true],['デンマーク',55.12,9.65],['オランダ',52.15,5.25],['ベルギー',50.85,4.6],['ルクセンブルク',49.63,5.4],['フランス',48.05,5.2],['スイス',46.85,8.2],['オーストリア',47.6,13.2],['チェコ',49.7,14.4],['ポーランド',52.0,16.8]];
    points.forEach(([name,lat,lon,germany])=>L.marker([lat,lon],{interactive:false,keyboard:false,
      icon:L.divIcon({className:germany?'countryLabel countryGermany':'countryLabel',html:'<span>'+name+'</span>',iconSize:germany?[90,30]:[96,24],iconAnchor:germany?[45,15]:[48,12]}),zIndexOffset:-500
    }).addTo(labels)); labels.addTo(map);
    const update=()=>{if(map.getZoom()>7){map.removeLayer(outline);map.removeLayer(labels)}else{outline.addTo(map);labels.addTo(map)}};
    map.on('zoomend',update);
    map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/about/terms-of-use/">Natural Earth</a> (Public domain)');
    return {outline,labels};
  }
};
