const mapElement = document.getElementById('poland-map');
const campusMapData = window.POLAND_CAMPUS_MAP;
if (mapElement && window.L && campusMapData) {
  const map = L.map(mapElement, {scrollWheelZoom: false});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);
  const outline = L.geoJSON(campusMapData.outline, {
    style: {color: '#982044', weight: 2, fillColor: '#f1b9c8', fillOpacity: 0.08}
  }).addTo(map);
  map.fitBounds(outline.getBounds(), {padding: [22, 22]});
  map.attributionControl.addAttribution('<a href="https://www.naturalearthdata.com/">Natural Earth</a>');
  const markers = [];
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
    const marker = L.marker([city.lat, city.lon], {title: city.name, alt: city.name})
      .addTo(map).bindTooltip(city.name, {permanent: true, direction: 'top', offset: [0, -30]}).bindPopup(popup);
    markers.push({city, marker, list});
  }
  document.addEventListener('universities-filtered', () => {
    const visibleGuides = new Set(
      [...document.querySelectorAll('.universityItem:not([hidden]) a[href^="guide-"]')]
        .map(link => link.getAttribute('href'))
    );
    const locations = [];
    for (const {city, marker, list} of markers) {
      const matches = city.guides.filter(guide => visibleGuides.has('guide-' + guide.id + '.html'));
      for (const item of list.children) {
        item.hidden = !visibleGuides.has(item.firstElementChild.getAttribute('href'));
      }
      if (matches.length) {
        marker.addTo(map);
        locations.push([city.lat, city.lon]);
      } else {
        map.removeLayer(marker);
      }
    }
    if (locations.length === 1) map.setView(locations[0], 11);
    if (locations.length > 1) map.fitBounds(locations, {padding: [35, 35], maxZoom: 11});
  });
}
