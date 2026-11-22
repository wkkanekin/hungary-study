const mapElement = document.getElementById('poland-map');
const campusMapData = window.POLAND_CAMPUS_MAP;
if (mapElement && window.L && campusMapData) {
  const map = L.map(mapElement, {scrollWheelZoom: false});
  const outline = L.geoJSON(campusMapData.outline, {
    style: {color: '#982044', weight: 2, fillColor: '#f1b9c8', fillOpacity: 0.65}
  }).addTo(map);
  map.fitBounds(outline.getBounds(), {padding: [22, 22]});
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  for (const city of campusMapData.cities) {
    const popup = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = city.name;
    popup.append(title);
    const list = document.createElement('ul');
    for (const guide of city.guides) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = 'guide-' + guide.id + '.html';
      link.textContent = guide.name;
      item.append(link);
      list.append(item);
    }
    popup.append(list);
    L.marker([city.lat, city.lon], {title: city.name, alt: city.name})
      .addTo(map).bindTooltip(city.name).bindPopup(popup);
  }
}
