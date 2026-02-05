// script.js
document.addEventListener("DOMContentLoaded", () => {
 // =========================
 // Mini TOC (right-top)
 // =========================
 const tocToggle = document.getElementById("tocToggle");
 const tocPanel = document.getElementById("tocPanel");

 if (tocToggle && tocPanel) {
 tocToggle.addEventListener("click", () => {
 const open = tocPanel.classList.toggle("open");
 tocToggle.setAttribute("aria-expanded", String(open));
 });

 // close when clicking a link
 tocPanel.querySelectorAll("a").forEach((a) => {
 a.addEventListener("click", () => {
 tocPanel.classList.remove("open");
 tocToggle.setAttribute("aria-expanded", "false");
 });
 });

 // close when clicking outside
 document.addEventListener("click", (e) => {
 const t = e.target;
 if (!t) return;
 if (tocPanel.contains(t) || tocToggle.contains(t)) return;
 tocPanel.classList.remove("open");
 tocToggle.setAttribute("aria-expanded", "false");
 });
 }

 // =========================
 // DOM refs
 // =========================
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");

 const applySearchBtn = document.getElementById("applySearch");
 const clearSearchBtn = document.getElementById("clearSearch");

 const suggestBox = document.getElementById("suggestBox");

 const studentListEl = document.getElementById("studentList");
 const noResultsEl = document.getElementById("noResults");

 // Map (city-based)
 const mapEl = document.getElementById("huMap");
 const uniListEl = document.getElementById("uniList");
 const mapHintEl = document.getElementById("mapHint");
 const clearUniBtn = document.getElementById("clearUniFilter");

 // Map (All universities via Overpass API)
 const allUniMapEl = document.getElementById("map"); // (index.html側にあれば動く)

 // =========================
 // Data load
 // =========================
 let STUDENTS = [];
 let CONFIG = null;

 async function loadJSON(url) {
 const res = await fetch(url, { cache: "no-store" });
 if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
 return res.json();
 }

 async function init() {
 // Load students + config if exists
 try {
 STUDENTS = await loadJSON("students.json");
 } catch (e) {
 console.error(e);
 STUDENTS = [];
 }

 try {
 CONFIG = await loadJSON("config.json");
 applyContactConfig(CONFIG);
 } catch (e) {
 // config optional (but you said it exists)
 console.error(e);
 }

 buildSuggestIndex(STUDENTS);
 renderStudents(STUDENTS); // initial render (all)

 // Wire search actions
 if (applySearchBtn) {
 applySearchBtn.addEventListener("click", () => {
 applySearchAndJump();
 });
 }

 if (clearSearchBtn) {
 clearSearchBtn.addEventListener("click", () => {
 clearSearchFields();
 renderStudents(STUDENTS);
 hideNoResults();
 });
 }

 // Suggest dropdown (custom)
 if (keywordInput) {
 keywordInput.addEventListener("input", () => showSuggestions(keywordInput.value));
 keywordInput.addEventListener("focus", () => showSuggestions(keywordInput.value));
 keywordInput.addEventListener("blur", () => {
 // wait a bit so click on suggestion works
 setTimeout(() => hideSuggestions(), 120);
 });
 keywordInput.addEventListener("keydown", (e) => {
 // Enter => apply search
 if (e.key === "Enter") {
 e.preventDefault();
 applySearchAndJump();
 }
 });
 }

 // Region/course changes should NOT auto filter (you requested button-based)
 // so we do nothing on change.
 // If you still want to hide suggestions on change:
 if (regionFilter) regionFilter.addEventListener("change", () => hideSuggestions());
 if (courseFilter) courseFilter.addEventListener("change", () => hideSuggestions());

 // Init map(s)
 initCityMap();
 initAllUniversitiesMap();
 }

 // =========================
 // Contact config
 // =========================
 function applyContactConfig(cfg) {
 if (!cfg) return;

 // form
 const formBtn = document.getElementById("contactFormBtn");
 if (formBtn && cfg.formUrl) {
 formBtn.href = cfg.formUrl;
 }

 // email
 const emailEl = document.getElementById("contactEmail");
 const emailText = document.getElementById("contactEmailText");
 if (emailEl && emailText && cfg.email) {
 emailEl.href = `mailto:${cfg.email}`;
 emailText.textContent = cfg.email;
 }

 // socials: expects {label,url} list
 const socials = Array.isArray(cfg.socials) ? cfg.socials : [];
 const map = new Map(socials.map((s) => [String(s.label || "").toLowerCase(), s.url]));

 // YouTube
 const yt = map.get("youtube");
 const ytEl = document.getElementById("contactYoutube");
 const ytText = document.getElementById("contactYoutubeText");
 if (ytEl && ytText && yt) {
 ytEl.href = yt;
 ytText.textContent = yt;
 }

 // Instagram
 const ig = map.get("instagram");
 const igEl = document.getElementById("contactInstagram");
 const igText = document.getElementById("contactInstagramText");
 if (igEl && igText && ig) {
 igEl.href = ig;
 igText.textContent = ig;
 }

 // Facebook
 const fb = map.get("facebook");
 const fbEl = document.getElementById("contactFacebook");
 const fbText = document.getElementById("contactFacebookText");
 if (fbEl && fbText && fb) {
 fbEl.href = fb;
 fbText.textContent = fb;
 }
 }

 // =========================
 // Student render
 // =========================
 function escapeHtml(str) {
 return String(str)
 .replaceAll("&", "&amp;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;")
 .replaceAll('"', "&quot;")
 .replaceAll("'", "&#039;");
 }

 function isEnabled(student) {
 return !!student.enabled;
 }

 function renderStudents(list) {
 if (!studentListEl) return;
 studentListEl.innerHTML = "";

 // Only show enabled + disabled (but disabled shows "準備中")
 list.forEach((s) => {
 const disabled = !isEnabled(s);

 const article = document.createElement("article");
 article.className = "student-card" + (disabled ? " is-disabled" : "");
 article.dataset.region = s.region || "";
 article.dataset.course = s.course || "";

 // stipendium display
 const stipendiumLine = s?.stipendium?.has
 ? `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">${escapeHtml(
 s.stipendium.name || "奨学金あり"
 )}</span></div>`
 : `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">なし</span></div>`;

 // links display (external links)
 const links = Array.isArray(s.links) ? s.links : [];
 const linksHtml =
 links.length > 0
 ? `
 <div class="meta-row">
 <span class="meta-k">外部：</span>
 <span class="meta-v">
 ${links
 .map((l) => {
 const label = escapeHtml(l.label || "リンク");
 const url = escapeHtml(l.url || "#");
 return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="text-decoration:underline">${label}</a>`;
 })
 .join(" / ")}
 </span>
 </div>`
 : `
 <div class="meta-row">
 <span class="meta-k">外部：</span>
 <span class="meta-v">—</span>
 </div>`;

 const tags = Array.isArray(s.tags) ? s.tags : [];
 const tagHtml = tags.map((t) => `<span class="hash">${escapeHtml(t)}</span>`).join("");

 const bookingBtnHtml = disabled
 ? `<a class="btn disabled" href="#" aria-disabled="true">空き枠を見る（準備中）</a>`
 : `<a class="btn" href="${escapeHtml(
 s.bookingUrl || "#"
 )}" target="_blank" rel="noopener noreferrer">空き枠を見る（6,000円 / 40分）</a>`;

 article.innerHTML = `
 <div class="profile-image profile-circle">
 <img src="${escapeHtml(s.avatar || "")}" alt="${escapeHtml(
 s.name || "プロフィール"
 )}のアバター" />
 </div>

 <div class="info">
 <h3 class="student-name">${escapeHtml(s.name || "")}</h3>

 <div class="profile-meta">
 <div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${escapeHtml(
 s.university || ""
 )}</span></div>
 <div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${escapeHtml(
 s.region || ""
 )}</span></div>
 <div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${escapeHtml(
 s.major || ""
 )}</span></div>
 <div class="meta-row"><span class="meta-k">学年：</span><span class="meta-v">${escapeHtml(
 s.year || ""
 )}</span></div>
 <div class="meta-row"><span class="meta-k">語学力：</span><span class="meta-v">${escapeHtml(
 s.language || ""
 )}</span></div>
 <div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${escapeHtml(
 s.meeting || ""
 )}</span></div>

 ${stipendiumLine}
 ${linksHtml}
 </div>

 <p class="bio">${escapeHtml(s.bio || "")}</p>

 <div class="tagline">
 ${tagHtml}
 </div>

 <div class="card-actions">
 ${bookingBtnHtml}
 </div>

 ${
 disabled
 ? `<p class="fineprint">※準備が整い次第、予約枠を公開します。</p>`
 : `<p class="fineprint">※面談はZoomで行います。</p>`
 }
 </div>
 `;

 studentListEl.appendChild(article);
 });
 }

 function hideNoResults() {
 if (noResultsEl) noResultsEl.style.display = "none";
 }

 function showNoResults() {
 if (noResultsEl) noResultsEl.style.display = "block";
 }

 function applySearchAndJump() {
 const filtered = filterStudentsFromFields();
 if (filtered.length === 0) {
 // hide cards, show no results block
 renderStudents([]); // clears
 showNoResults();
 } else {
 hideNoResults();
 renderStudents(filtered);
 }

 // jump to students section
 document.getElementById("students")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }

 function clearSearchFields() {
 if (keywordInput) keywordInput.value = "";
 if (regionFilter) regionFilter.value = "";
 if (courseFilter) courseFilter.value = "";
 hideSuggestions();
 }

 function filterStudentsFromFields() {
 const kw = (keywordInput?.value || "").trim().toLowerCase();
 const region = regionFilter?.value || "";
 const course = courseFilter?.value || "";

 return STUDENTS.filter((s) => {
 const hay = [
 s.name,
 s.region,
 s.course,
 s.university,
 s.major,
 s.year,
 s.language,
 s.meeting,
 s.bio,
 ...(Array.isArray(s.tags) ? s.tags : []),
 ...(Array.isArray(s.links) ? s.links.map((l) => `${l.label} ${l.url}`) : []),
 s?.stipendium?.has ? s?.stipendium?.name : "",
 ]
 .filter(Boolean)
 .join(" ")
 .toLowerCase();

 const okKw = !kw || hay.includes(kw);
 const okRegion = !region || (s.region || "") === region;
 const okCourse = !course || (s.course || "") === course;
 return okKw && okRegion && okCourse;
 });
 }

 // =========================
 // Suggest (dropdown)
 // =========================
 let SUGGEST_INDEX = [];

 function buildSuggestIndex(students) {
 const set = new Set();

 students.forEach((s) => {
 if (!s) return;
 if (s.name) set.add(s.name);
 if (s.region) set.add(s.region);
 if (s.course) set.add(s.course);
 if (s.university) set.add(s.university);
 if (s.major) set.add(s.major);
 if (s.year) set.add(s.year);

 (Array.isArray(s.tags) ? s.tags : []).forEach((t) => set.add(t));
 (Array.isArray(s.links) ? s.links : []).forEach((l) => {
 if (l?.label) set.add(l.label);
 });

 if (s?.stipendium?.has && s?.stipendium?.name) set.add(s.stipendium.name);
 });

 SUGGEST_INDEX = Array.from(set).filter(Boolean);
 }

 function hideSuggestions() {
 if (!suggestBox) return;
 suggestBox.style.display = "none";
 suggestBox.innerHTML = "";
 }

 function showSuggestions(query) {
 if (!suggestBox || !keywordInput) return;

 const q = (query || "").trim().toLowerCase();
 if (!q) {
 hideSuggestions();
 return;
 }

 const hits = SUGGEST_INDEX.filter((s) => String(s).toLowerCase().includes(q)).slice(0, 10);
 if (hits.length === 0) {
 hideSuggestions();
 return;
 }

 suggestBox.innerHTML = hits
 .map(
 (h) =>
 `<button type="button" class="suggest-item" data-value="${escapeHtml(h)}">${escapeHtml(
 h
 )}</button>`
 )
 .join("");

 suggestBox.style.display = "block";

 suggestBox.querySelectorAll(".suggest-item").forEach((btn) => {
 btn.addEventListener("mousedown", (e) => {
 // mousedown so it runs before blur
 e.preventDefault();
 const v = btn.getAttribute("data-value") || "";
 keywordInput.value = v;
 hideSuggestions();
 });
 });
 }

 // =========================
 // City map (your original style)
 // =========================
 function initCityMap() {
 if (!mapEl || !window.L) return;

 // city coords
 const cityCoords = {
 "ブダペスト": { lat: 47.4979, lng: 19.0402 },
 "デブレツェン": { lat: 47.5316, lng: 21.6273 },
 "セゲド": { lat: 46.2530, lng: 20.1414 },
 "ペーチ": { lat: 46.0727, lng: 18.2323 },
 "ミシュコルツ": { lat: 48.1035, lng: 20.7784 },
 "ショプロン": { lat: 47.6817, lng: 16.5845 },
 "ジェール": { lat: 47.6875, lng: 17.6504 },
 "ヴェスプレーム": { lat: 47.0930, lng: 17.9110 },
 "ニーレジハーザ": { lat: 47.9554, lng: 21.7167 },
 "ドゥナウーイヴァーロシュ": { lat: 46.9619, lng: 18.9355 },
 "ケチケメート": { lat: 46.8964, lng: 19.6897 },
 "ギョドゥルー": { lat: 47.5966, lng: 19.3552 },
 "エゲル": { lat: 47.9025, lng: 20.3772 },
 "シャーロシュパタク": { lat: 48.3245, lng: 21.5686 },
 "ヴァーツ": { lat: 47.7785, lng: 19.1280 },
 "バヤ": { lat: 46.1803, lng: 18.9567 },
 };

 // universities by city (same list as you gave earlier)
 const universities = [
 // Budapest
 { name: "Budapest University of Technology and Economics", city: "ブダペスト" },
 { name: "Corvinus University of Budapest", city: "ブダペスト" },
 { name: "Eötvös Loránd University", city: "ブダペスト" },
 { name: "Semmelweis University", city: "ブダペスト" },
 { name: "Hungarian University of Fine Arts", city: "ブダペスト" },
 { name: "Hungarian University of Sports Science", city: "ブダペスト" },
 { name: "Hungarian Dance University", city: "ブダペスト" },
 { name: "Liszt Ferenc Academy of Music", city: "ブダペスト" },
 { name: "Moholy-Nagy University of Art and Design", city: "ブダペスト" },
 { name: "Óbuda University", city: "ブダペスト" },
 { name: "Pázmány Péter Catholic University", city: "ブダペスト" },
 { name: "Károli Gáspár University of the Reformed Church in Hungary", city: "ブダペスト" },
 { name: "Ludovika University of Public Service", city: "ブダペスト" },
 { name: "John Wesley Theological College", city: "ブダペスト" },
 { name: "Dharma Gate Buddhist College", city: "ブダペスト" },
 { name: "Budapest Metropolitan University", city: "ブダペスト" },
 { name: "Budapest University of Economics and Business", city: "ブダペスト" },
 { name: "University of Veterinary Medicine Budapest", city: "ブダペスト" },
 { name: "MFA Balassi Preparatory Programme", city: "ブダペスト" },

 // Regional
 { name: "University of Debrecen", city: "デブレツェン" },
 { name: "University of Szeged", city: "セゲド" },
 { name: "University of Pécs", city: "ペーチ" },
 { name: "University of Miskolc", city: "ミシュコルツ" },
 { name: "University of Sopron", city: "ショプロン" },
 { name: "Széchenyi István University", city: "ジェール" },
 { name: "University of Pannonia", city: "ヴェスプレーム" },
 { name: "University of Nyíregyháza", city: "ニーレジハーザ" },
 { name: "University of Dunaújváros", city: "ドゥナウーイヴァーロシュ" },
 { name: "John von Neumann University", city: "ケチケメート" },
 { name: "Hungarian University of Agriculture and Life Sciences (MATE)", city: "ギョドゥルー" },
 { name: "Eszterházy Károly Catholic University", city: "エゲル" },
 { name: "University of Tokaj", city: "シャーロシュパタク" },

 // Small / specialized
 { name: "Apor Vilmos Catholic College", city: "ヴァーツ" },
 { name: "Episcopal Theological College of Pécs", city: "ペーチ" },
 { name: "Eötvös József College", city: "バヤ" },
 { name: "Kodály Institute", city: "ケチケメート" },
 ];

 function groupByCity(items) {
 const map = new Map();
 items.forEach((u) => {
 if (!map.has(u.city)) map.set(u.city, []);
 map.get(u.city).push(u);
 });
 return map;
 }

 function renderUniversityList(city, list) {
 if (!uniListEl) return;
 if (mapHintEl) mapHintEl.style.display = "none";
 uniListEl.innerHTML = "";

 const wrap = document.createElement("div");
 wrap.className = "uni-item";

 const cityEl = document.createElement("div");
 cityEl.className = "uni-city";
 cityEl.textContent = `${city}（${list.length}校）`;
 wrap.appendChild(cityEl);

 list.forEach((u) => {
 const btn = document.createElement("button");
 btn.type = "button";
 btn.className = "uni-btn";
 btn.textContent = u.name;

 btn.addEventListener("click", () => {
 // put into keyword + apply search + jump
 if (keywordInput) keywordInput.value = u.name;
 hideSuggestions();
 applySearchAndJump();
 });

 wrap.appendChild(btn);
 });

 uniListEl.appendChild(wrap);
 }

 function clearUniversityFilter() {
 if (keywordInput) keywordInput.value = "";
 hideSuggestions();
 if (uniListEl) uniListEl.innerHTML = "";
 if (mapHintEl) mapHintEl.style.display = "block";
 }

 if (clearUniBtn) clearUniBtn.addEventListener("click", clearUniversityFilter);

 const huMap = L.map("huMap", { scrollWheelZoom: false });
 huMap.setView([47.1625, 19.5033], 7);

 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 attribution: "&copy; OpenStreetMap contributors",
 }).addTo(huMap);

 const byCity = groupByCity(universities);

 byCity.forEach((list, city) => {
 const c = cityCoords[city];
 if (!c) return;

 const marker = L.circleMarker([c.lat, c.lng], {
 radius: 8,
 weight: 2,
 fillOpacity: 0.7,
 }).addTo(huMap);

 marker.bindTooltip(`${city}（${list.length}）`, { direction: "top" });

 marker.on("mouseover", () => marker.setStyle({ radius: 12, weight: 3, fillOpacity: 0.9 }));
 marker.on("mouseout", () => marker.setStyle({ radius: 8, weight: 2, fillOpacity: 0.7 }));

 marker.on("click", () => {
 renderUniversityList(city, list);
 });
 });
 }

 // =========================
 // All universities map (Overpass) - optional
 // =========================
 async function initAllUniversitiesMap() {
 // This block only runs if index.html has a #map element.
 if (!allUniMapEl || !window.L) return;

 const mapStatus = document.getElementById("mapStatus");
 const overpassUrl = "https://overpass-api.de/api/interpreter";

 const map = L.map("map", { scrollWheelZoom: false }).setView([47.1625, 19.5033], 7);

 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 maxZoom: 19,
 attribution: "&copy; OpenStreetMap contributors",
 }).addTo(map);

 // If MarkerCluster is available, use it.
 const hasCluster = !!L.markerClusterGroup;
 const cluster = hasCluster
 ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 44 })
 : null;

 if (cluster) map.addLayer(cluster);

 const query = `
[out:json][timeout:30];
area["name"="Hungary"]["boundary"="administrative"]["admin_level"="2"]->.a;
(
 node["amenity"="university"](area.a);
 way["amenity"="university"](area.a);
 relation["amenity"="university"](area.a);
);
out center tags;
`.trim();

 try {
 if (mapStatus) mapStatus.textContent = "大学データ取得中…";

 const res = await fetch(overpassUrl, {
 method: "POST",
 headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
 body: "data=" + encodeURIComponent(query),
 });

 if (!res.ok) throw new Error("Overpass error: " + res.status);

 const data = await res.json();
 const els = data.elements || [];

 let count = 0;

 els.forEach((e) => {
 const lat = e.lat ?? (e.center && e.center.lat);
 const lon = e.lon ?? (e.center && e.center.lon);
 if (typeof lat !== "number" || typeof lon !== "number") return;

 const name = (e.tags && (e.tags.name || e.tags["name:en"])) || "University (no name)";
 const website = e.tags && (e.tags.website || e.tags.url || e.tags["contact:website"]);
 const city = e.tags && (e.tags["addr:city"] || e.tags["is_in:city"] || e.tags["addr:suburb"]);

 const lines = [];
 lines.push(`<strong>${escapeHtml(name)}</strong>`);
 if (city)
 lines.push(`<div style="margin-top:6px;font-weight:800;color:#475569">City: ${escapeHtml(city)}</div>`);
 if (website)
 lines.push(
 `<div style="margin-top:6px"><a href="${escapeHtml(
 website
 )}" target="_blank" rel="noopener">Website</a></div>`
 );

 const marker = L.marker([lat, lon]).bindPopup(lines.join(""));

 if (cluster) {
 cluster.addLayer(marker);
 } else {
 marker.addTo(map);
 }
 count++;
 });

 if (mapStatus) mapStatus.textContent = `表示中：${count.toLocaleString()} 校`;
 } catch (err) {
 console.error(err);
 if (mapStatus) mapStatus.textContent = "読み込み失敗（時間を置いて再読み込みしてください）";
 }
 }

 // =========================
 // Kick off
 // =========================
 init();
});