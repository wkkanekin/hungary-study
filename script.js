document.addEventListener("DOMContentLoaded", () => {
 // -------------------------
 // Elements
 // -------------------------
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");
 const searchBtn = document.getElementById("searchBtn");
 const studentListEl = document.getElementById("studentList");
 const noResultEl = document.getElementById("noResult");
 const templateEl = document.getElementById("questionTemplate");

 // Map elements
 const mapEl = document.getElementById("huMap");
 const uniListEl = document.getElementById("uniList");
 const mapHintEl = document.getElementById("mapHint");
 const clearUniBtn = document.getElementById("clearUniFilter");

 // Suggest dropdown
 const suggestBox = document.getElementById("suggestBox");

 // -------------------------
 // Helpers
 // -------------------------
 function escapeHtml(str) {
 return String(str ?? "")
 .replaceAll("&", "&amp;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;")
 .replaceAll('"', "&quot;")
 .replaceAll("'", "&#039;");
 }

 function toast(message) {
 const el = document.createElement("div");
 el.textContent = message;
 el.style.position = "fixed";
 el.style.left = "50%";
 el.style.bottom = "22px";
 el.style.transform = "translateX(-50%)";
 el.style.background = "rgba(18,22,40,0.92)";
 el.style.color = "#fff";
 el.style.padding = "10px 14px";
 el.style.borderRadius = "12px";
 el.style.fontWeight = "700";
 el.style.fontSize = "14px";
 el.style.zIndex = "9999";
 el.style.maxWidth = "90vw";
 el.style.textAlign = "center";
 document.body.appendChild(el);
 setTimeout(() => el.remove(), 1800);
 }

 async function copyToClipboard(text) {
 try {
 await navigator.clipboard.writeText(text);
 return true;
 } catch (e) {
 const ta = document.createElement("textarea");
 ta.value = text;
 document.body.appendChild(ta);
 ta.select();
 try {
 document.execCommand("copy");
 document.body.removeChild(ta);
 return true;
 } catch (err) {
 document.body.removeChild(ta);
 return false;
 }
 }
 }

 function showNoResult(show) {
 if (!noResultEl) return;
 noResultEl.style.display = show ? "block" : "none";
 }

 // -------------------------
 // Render external links (NEW)
 // -------------------------
 function renderExternalLinks(links) {
 if (!Array.isArray(links) || links.length === 0) return "";

 const items = links
 .filter((l) => l && typeof l.url === "string" && l.url.startsWith("http"))
 .map((l) => {
 const label = escapeHtml(l.label || "外部リンク");
 const url = l.url;
 return `<a class="ext-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
 })
 .join("");

 if (!items) return "";

 return `
 <div class="external-links">
 <div class="external-links-title">その他（外部リンク）</div>
 <div class="external-links-items">${items}</div>
 <p class="fineprint">※外部リンクは本人が公開している情報へのリンクです。</p>
 </div>
 `;
 }

 // -------------------------
 // Students (from students.json)
 // -------------------------
 let students = [];

 function buildStudentCard(student) {
 const disabled = !student.enabled;
 const tagsHtml = Array.isArray(student.tags)
 ? student.tags.map((t) => `<span class="hash">${escapeHtml(t)}</span>`).join("")
 : "";

 const stipendiumHtml =
 student?.stipendium?.has
 ? `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">${escapeHtml(student.stipendium.name || "あり")}</span></div>`
 : `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">なし</span></div>`;

 const yearHtml = student.year
 ? `<div class="meta-row"><span class="meta-k">学年：</span><span class="meta-v">${escapeHtml(student.year)}</span></div>`
 : "";

 const bookingButton = disabled
 ? `<a class="btn disabled" href="#" aria-disabled="true">空き枠を見る（準備中）</a>`
 : `<a class="btn" href="${escapeHtml(student.bookingUrl || "#")}" target="_blank" rel="noopener noreferrer">空き枠を見る（6,000円 / 40分）</a>`;

 const fineprint = disabled
 ? `<p class="fineprint">※準備が整い次第、予約枠を公開します。</p>`
 : `<p class="fineprint">※面談はZoomで行います（無料プランだと40分で切れるため、40分枠です）。</p>`;

 return `
 <article class="student-card ${disabled ? "is-disabled" : ""}" data-region="${escapeHtml(student.region || "")}" data-course="${escapeHtml(student.course || "")}">
 <div class="profile-image profile-circle">
 <img src="${escapeHtml(student.avatar || "")}" alt="${escapeHtml(student.name || "")}のプロフィール画像" />
 </div>

 <div class="info">
 <h3 class="student-name">${escapeHtml(student.name || "")}</h3>

 <div class="profile-meta">
 <div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${escapeHtml(student.university || "")}</span></div>
 <div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${escapeHtml(student.region || "")}</span></div>
 <div class="meta-row"><span class="meta-k">分野：</span><span class="meta-v">${escapeHtml(student.course || "")}</span></div>
 <div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${escapeHtml(student.major || "")}</span></div>
 ${yearHtml}
 <div class="meta-row"><span class="meta-k">語学力：</span><span class="meta-v">${escapeHtml(student.language || "")}</span></div>
 <div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${escapeHtml(student.meeting || "Zoomのみ")}</span></div>
 ${stipendiumHtml}
 </div>

 <p class="bio">${escapeHtml(student.bio || "")}</p>

 <div class="tagline">
 ${tagsHtml}
 </div>

 ${renderExternalLinks(student.links)}

 <div class="card-actions">
 ${bookingButton}
 </div>

 ${fineprint}
 </div>
 </article>
 `;
 }

 function renderStudents(list) {
 if (!studentListEl) return;
 studentListEl.innerHTML = "";
 showNoResult(false);

 if (!Array.isArray(list) || list.length === 0) {
 showNoResult(true);
 return;
 }

 studentListEl.insertAdjacentHTML(
 "beforeend",
 list.map(buildStudentCard).join("")
 );
 }

 function getSearchText() {
 return (keywordInput?.value || "").trim().toLowerCase();
 }

 function applyFilter() {
 const keyword = getSearchText();
 const region = regionFilter?.value || "";
 const course = courseFilter?.value || "";

 const filtered = students.filter((s) => {
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
 ...(Array.isArray(s.links) ? s.links.map((l) => l.label + " " + l.url) : []),
 s?.stipendium?.has ? (s?.stipendium?.name || "奨学金") : "奨学金なし",
 ]
 .filter(Boolean)
 .join(" ")
 .toLowerCase();

 const matchKeyword = !keyword || hay.includes(keyword);
 const matchRegion = !region || (s.region || "").includes(region);
 const matchCourse = !course || (s.course || "").includes(course);

 return matchKeyword && matchRegion && matchCourse;
 });

 renderStudents(filtered);
 document.getElementById("students")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }

 // -------------------------
 // Suggest dropdown (NEW)
 // -------------------------
 let suggestItems = [];

 function buildSuggestItems() {
 const set = new Set();

 students.forEach((s) => {
 if (s.name) set.add(s.name);
 if (s.region) set.add(s.region);
 if (s.course) set.add(s.course);
 if (s.university) set.add(s.university);
 if (s.major) set.add(s.major);
 if (s.year) set.add(s.year);

 if (Array.isArray(s.tags)) s.tags.forEach((t) => set.add(t));
 });

 suggestItems = Array.from(set).filter(Boolean);
 }

 function openSuggest(list) {
 if (!suggestBox) return;
 if (!list || list.length === 0) {
 suggestBox.style.display = "none";
 suggestBox.innerHTML = "";
 return;
 }

 suggestBox.innerHTML = list
 .slice(0, 10)
 .map((t) => `<button type="button" class="suggest-item">${escapeHtml(t)}</button>`)
 .join("");

 suggestBox.style.display = "block";

 suggestBox.querySelectorAll(".suggest-item").forEach((btn) => {
 btn.addEventListener("click", () => {
 if (keywordInput) keywordInput.value = btn.textContent || "";
 suggestBox.style.display = "none";
 suggestBox.innerHTML = "";
 keywordInput?.focus();
 });
 });
 }

 function onKeywordInput() {
 const q = getSearchText();
 if (!q) {
 openSuggest([]);
 return;
 }

 const matched = suggestItems.filter((t) => t.toLowerCase().includes(q));
 openSuggest(matched);
 }

 document.addEventListener("click", (e) => {
 if (!suggestBox || !keywordInput) return;
 const target = e.target;
 if (target === keywordInput || suggestBox.contains(target)) return;
 suggestBox.style.display = "none";
 });

 if (keywordInput) keywordInput.addEventListener("input", onKeywordInput);

 // -------------------------
 // Search button
 // -------------------------
 if (searchBtn) {
 searchBtn.addEventListener("click", () => {
 applyFilter();
 });
 }

 // -------------------------
 // Copy template (if you still use it somewhere else)
 // -------------------------
 document.querySelectorAll("[data-copy-template]").forEach((btn) => {
 btn.addEventListener("click", async () => {
 const text = (templateEl?.value || "").trim();
 if (!text) {
 toast("テンプレの読み込みに失敗しました。");
 return;
 }
 const ok = await copyToClipboard(text);
 toast(ok ? "質問例をコピーしました" : "コピーに失敗しました");
 });
 });

 // -------------------------
 // FAQ accordion
 // -------------------------
 const faqDetails = document.querySelectorAll(".faq details");
 faqDetails.forEach((d) => {
 d.addEventListener("toggle", () => {
 if (!d.open) return;
 faqDetails.forEach((other) => {
 if (other !== d) other.open = false;
 });
 });
 });

 // -------------------------
 // Map-based university search (Leaflet)
 // -------------------------
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
 "バヤ": { lat: 46.1803, lng: 18.9567 }
 };

 const universities = [
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

 { name: "Apor Vilmos Catholic College", city: "ヴァーツ" },
 { name: "Episcopal Theological College of Pécs", city: "ペーチ" },
 { name: "Eötvös József College", city: "バヤ" },
 { name: "Kodály Institute", city: "ケチケメート" }
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
 if (keywordInput) keywordInput.value = u.name;
 toast("検索条件に反映しました。検索ボタンを押してください。");
 document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "start" });
 });

 wrap.appendChild(btn);
 });

 uniListEl.appendChild(wrap);
 }

 function clearUniversityFilter() {
 if (keywordInput) keywordInput.value = "";
 if (uniListEl) uniListEl.innerHTML = "";
 if (mapHintEl) mapHintEl.style.display = "block";
 toast("検索欄をクリアしました。");
 }

 if (clearUniBtn) clearUniBtn.addEventListener("click", clearUniversityFilter);

 if (mapEl && window.L) {
 const huMap = L.map("huMap", { scrollWheelZoom: false });
 huMap.setView([47.1625, 19.5033], 7);

 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 attribution: "&copy; OpenStreetMap contributors"
 }).addTo(huMap);

 const byCity = groupByCity(universities);

 byCity.forEach((list, city) => {
 const c = cityCoords[city];
 if (!c) return;

 const marker = L.circleMarker([c.lat, c.lng], {
 radius: 8,
 weight: 2,
 fillOpacity: 0.7
 }).addTo(huMap);

 marker.bindTooltip(`${city}（${list.length}）`, { direction: "top" });

 marker.on("mouseover", () => marker.setStyle({ radius: 12, weight: 3, fillOpacity: 0.9 }));
 marker.on("mouseout", () => marker.setStyle({ radius: 8, weight: 2, fillOpacity: 0.7 }));

 marker.on("click", () => {
 renderUniversityList(city, list);
 });
 });
 }

 // -------------------------
 // Load students.json
 // -------------------------
 async function loadStudents() {
 try {
 const res = await fetch("./students.json", { cache: "no-store" });
 if (!res.ok) throw new Error("students.json の読み込みに失敗");
 const data = await res.json();
 students = Array.isArray(data) ? data : [];
 buildSuggestItems();
 renderStudents(students); // 初期は全表示
 } catch (e) {
 console.error(e);
 showNoResult(true);
 }
 }

 loadStudents();
});