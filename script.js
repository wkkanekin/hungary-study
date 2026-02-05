document.addEventListener("DOMContentLoaded", async () => {
 // =========================
 // Elements
 // =========================
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");
 const searchBtn = document.getElementById("searchBtn");

 const studentListEl = document.getElementById("studentList");
 const noResultsEl = document.getElementById("noResults");

 const suggestWrap = document.getElementById("suggestWrap");

 // Map
 const mapEl = document.getElementById("huMap");
 const uniListEl = document.getElementById("uniList");
 const mapHintEl = document.getElementById("mapHint");
 const clearUniBtn = document.getElementById("clearUniFilter");

 // Contact
 const contactFormBtn = document.getElementById("contactFormBtn");
 const socialLinksEl = document.getElementById("socialLinks");
 const contactEmailEl = document.getElementById("contactEmail");

 // =========================
 // Data holders
 // =========================
 let students = [];
 let suggestPool = [];

 // =========================
 // Load students.json
 // =========================
 try {
 const res = await fetch("students.json");
 students = await res.json();
 } catch (e) {
 console.error("students.json 読み込み失敗", e);
 students = [];
 }

 // =========================
 // Load config.json
 // =========================
 try {
 const res = await fetch("config.json");
 const config = await res.json();

 if (config.formUrl && contactFormBtn) {
 contactFormBtn.href = config.formUrl;
 contactFormBtn.style.display = "inline-flex";
 }

 if (Array.isArray(config.socials) && socialLinksEl) {
 config.socials.forEach((s) => {
 const a = document.createElement("a");
 a.className = "chip";
 a.href = s.url;
 a.target = "_blank";
 a.rel = "noopener noreferrer";
 a.textContent = s.label;
 socialLinksEl.appendChild(a);
 });
 }

 if (config.email && contactEmailEl) {
 contactEmailEl.textContent = `メール：${config.email}`;
 contactEmailEl.style.display = "block";
 }
 } catch (e) {
 console.warn("config.json 未設定");
 }

 // =========================
 // Build suggest pool
 // =========================
 students.forEach((s) => {
 if (s.university) suggestPool.push({ type: "大学", value: s.university });
 if (s.region) suggestPool.push({ type: "地域", value: s.region });
 if (s.course) suggestPool.push({ type: "分野", value: s.course });
 if (Array.isArray(s.tags)) {
 s.tags.forEach((t) => suggestPool.push({ type: "タグ", value: t }));
 }
 });

 // unique
 suggestPool = Array.from(
 new Map(suggestPool.map((i) => [i.type + i.value, i])).values()
 );

 // =========================
 // Render students
 // =========================
 function renderStudents(list) {
 studentListEl.innerHTML = "";
 noResultsEl.style.display = "none";

 if (list.length === 0) {
 noResultsEl.style.display = "block";
 return;
 }

 list.forEach((s) => {
 const card = document.createElement("article");
 card.className = "student-card" + (s.enabled ? "" : " is-disabled");

 card.innerHTML = `
 <div class="profile-image profile-circle">
 <img src="${s.avatar}" alt="${s.name}">
 </div>

 <div class="info">
 <h3 class="student-name">${s.name}</h3>

 <div class="profile-meta">
 <div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${s.university}</span></div>
 <div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${s.region}</span></div>
 <div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${s.major}</span></div>
 <div class="meta-row"><span class="meta-k">学年：</span><span class="meta-v">${s.year || "-"}</span></div>
 <div class="meta-row"><span class="meta-k">語学：</span><span class="meta-v">${s.language}</span></div>
 <div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${s.meeting}</span></div>
 ${
 s.stipendium?.has
 ? `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">${s.stipendium.name}</span></div>`
 : ""
 }
 </div>

 <p class="bio">${s.bio}</p>

 <div class="tagline">
 ${(s.tags || []).map((t) => `<span class="hash">${t}</span>`).join("")}
 </div>

 ${
 Array.isArray(s.links) && s.links.length
 ? `<div class="tagline">
 ${s.links
 .map(
 (l) =>
 `<a class="hash" href="${l.url}" target="_blank" rel="noopener noreferrer">${l.label}</a>`
 )
 .join("")}
 </div>`
 : ""
 }

 <div class="card-actions">
 ${
 s.enabled
 ? `<a class="btn" href="${s.bookingUrl}" target="_blank">空き枠を見る（6,000円 / 40分）</a>`
 : `<a class="btn disabled" href="#">準備中</a>`
 }
 </div>
 </div>
 `;

 studentListEl.appendChild(card);
 });
 }

 // 初期表示（全員）
 renderStudents(students);

 // =========================
 // Search logic
 // =========================
 function applySearch() {
 const keyword = keywordInput.value.trim().toLowerCase();
 const region = regionFilter.value;
 const course = courseFilter.value;

 const filtered = students.filter((s) => {
 const text =
 `${s.name} ${s.university} ${s.region} ${s.course} ${s.major} ${(s.tags || []).join(" ")}`.toLowerCase();

 const okKeyword = !keyword || text.includes(keyword);
 const okRegion = !region || s.region === region;
 const okCourse = !course || s.course === course;

 return okKeyword && okRegion && okCourse;
 });

 renderStudents(filtered);
 document.getElementById("students").scrollIntoView({ behavior: "smooth" });
 }

 if (searchBtn) {
 searchBtn.addEventListener("click", applySearch);
 }

 // =========================
 // Suggest dropdown
 // =========================
 if (keywordInput && suggestWrap) {
 keywordInput.addEventListener("input", () => {
 const v = keywordInput.value.trim().toLowerCase();
 suggestWrap.innerHTML = "";
 if (!v) return;

 const hit = suggestPool.filter((i) =>
 i.value.toLowerCase().includes(v)
 ).slice(0, 8);

 if (hit.length === 0) return;

 const box = document.createElement("div");
 box.className = "suggest";

 hit.forEach((i) => {
 const div = document.createElement("div");
 div.className = "suggest-item";
 div.innerHTML = `
 <span class="suggest-kind">${i.type}</span>
 <span class="suggest-text">${i.value}</span>
 `;
 div.addEventListener("click", () => {
 keywordInput.value = i.value;
 suggestWrap.innerHTML = "";
 });
 box.appendChild(div);
 });

 suggestWrap.appendChild(box);
 });

 document.addEventListener("click", (e) => {
 if (!suggestWrap.contains(e.target) && e.target !== keywordInput) {
 suggestWrap.innerHTML = "";
 }
 });
 }

 // =========================
 // Map (Leaflet)
 // =========================
 if (mapEl && window.L) {
 const cityCoords = {
 "ブダペスト": [47.4979, 19.0402],
 "セゲド": [46.253, 20.1414],
 "ペーチ": [46.0727, 18.2323],
 "デブレツェン": [47.5316, 21.6273]
 };

 const universities = {};
 students.forEach((s) => {
 if (!universities[s.region]) universities[s.region] = new Set();
 universities[s.region].add(s.university);
 });

 const map = L.map("huMap", { scrollWheelZoom: false }).setView(
 [47.1625, 19.5033],
 7
 );

 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 attribution: "&copy; OpenStreetMap contributors",
 }).addTo(map);

 Object.entries(cityCoords).forEach(([city, coord]) => {
 const list = Array.from(universities[city] || []);
 if (list.length === 0) return;

 const marker = L.circleMarker(coord, {
 radius: 8,
 weight: 2,
 fillOpacity: 0.7,
 }).addTo(map);

 marker.bindTooltip(`${city}（${list.length}）`);

 marker.on("click", () => {
 uniListEl.innerHTML = "";
 mapHintEl.style.display = "none";

 list.forEach((u) => {
 const btn = document.createElement("button");
 btn.className = "uni-btn";
 btn.textContent = u;
 btn.onclick = () => {
 keywordInput.value = u;
 };
 uniListEl.appendChild(btn);
 });
 });
 });
 }

 if (clearUniBtn) {
 clearUniBtn.addEventListener("click", () => {
 keywordInput.value = "";
 uniListEl.innerHTML = "";
 mapHintEl.style.display = "block";
 });
 }
});