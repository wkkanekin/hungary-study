document.addEventListener("DOMContentLoaded", async () => {
 // -------------------------
 // DOM refs
 // -------------------------
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");

 const searchBtn = document.getElementById("searchBtn");
 const clearBtn = document.getElementById("clearBtn");

 const studentListEl = document.getElementById("studentList");
 const noResultsEl = document.getElementById("noResults");

 const suggestBox = document.getElementById("suggestBox");

 // Map refs
 const mapEl = document.getElementById("huMap");
 const uniListEl = document.getElementById("uniList");
 const mapHintEl = document.getElementById("mapHint");
 const clearUniBtn = document.getElementById("clearUniFilter");
 const mapToSearchBtn = document.getElementById("mapToSearchBtn");

 // Contact refs
 const contactFacebook = document.getElementById("contactFacebook");
 const contactYouTube = document.getElementById("contactYouTube");
 const contactInstagram = document.getElementById("contactInstagram");
 const contactEmail = document.getElementById("contactEmail");
 const contactFormBtn = document.getElementById("contactFormBtn");

 // Template
 const templateEl = document.getElementById("questionTemplate");

 // -------------------------
 // helpers (toast / copy)
 // -------------------------
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
 // load JSON (students + config)
 // -------------------------
 let students = [];
 let config = null;

 async function loadJson(path) {
 const res = await fetch(path, { cache: "no-store" });
 if (!res.ok) throw new Error(`Failed to load ${path}`);
 return await res.json();
 }

 try {
 students = await loadJson("./students.json");
 } catch (e) {
 console.error(e);
 toast("students.json の読み込みに失敗しました");
 }

 try {
 config = await loadJson("./config.json");
 } catch (e) {
 console.error(e);
 // configは無くても動く
 }

 // reflect config into links
 if (config) {
 if (contactFacebook && config.facebook) contactFacebook.href = config.facebook;
 if (contactYouTube && config.youtube) contactYouTube.href = config.youtube;
 if (contactInstagram && config.instagram) contactInstagram.href = config.instagram;

 if (contactEmail && config.email) {
 contactEmail.href = `mailto:${config.email}`;
 contactEmail.textContent = `メール（${config.email}）`;
 }

 if (contactFormBtn && config.formUrl) contactFormBtn.href = config.formUrl;
 }

 // -------------------------
 // Render students
 // -------------------------
 function escapeHtml(str) {
 return String(str ?? "")
 .replaceAll("&", "&amp;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;")
 .replaceAll('"', "&quot;")
 .replaceAll("'", "&#039;");
 }

 function buildLinks(links) {
 if (!Array.isArray(links) || links.length === 0) return "";
 const items = links
 .filter((l) => l && l.label && l.url)
 .map((l) => {
 const label = escapeHtml(l.label);
 const url = escapeHtml(l.url);
 return `<a class="btn ghost full" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
 })
 .join("");
 return `
 <div class="divider"></div>
 <h3>その他（外部リンク）</h3>
 <div class="contact-links">${items}</div>
 `;
 }

 function studentCardHtml(s) {
 const isDisabled = !s.enabled;
 const cardClass = `student-card${isDisabled ? " is-disabled" : ""}`;

 // stipendium
 let stipendText = "—";
 if (s.stipendium && s.stipendium.has) {
 stipendText = escapeHtml(s.stipendium.name || "スティペンディウム・ハンガリカム");
 }

 const bookingUrl = s.bookingUrl || "#";
 const bookingBtn = s.enabled
 ? `<a class="btn" href="${escapeHtml(bookingUrl)}" target="_blank" rel="noopener noreferrer">空き枠を見る（6,000円 / 40分）</a>`
 : `<a class="btn disabled" href="#" aria-disabled="true">空き枠を見る（準備中）</a>`;

 const fineprint = s.enabled
 ? `※面談はZoomで行います（Meet等は使用しません）。`
 : `※準備が整い次第、予約枠を公開します。`;

 const tagsHtml = Array.isArray(s.tags)
 ? s.tags.map((t) => `<span class="hash">${escapeHtml(t)}</span>`).join("")
 : "";

 // 重要：検索のためにdata-属性を維持
 const dataRegion = escapeHtml(s.region || "");
 const dataCourse = escapeHtml(s.course || "");

 // カード本文（デザインは元の構造に合わせる）
 return `
 <article class="${cardClass}" data-region="${dataRegion}" data-course="${dataCourse}">
 <div class="profile-image profile-circle">
 <img src="${escapeHtml(s.avatar || "https://placehold.co/520x520/png?text=Student")}" alt="${escapeHtml(s.name || "学生")}のプロフィール写真（プレースホルダー）" />
 </div>

 <div class="info">
 <h3 class="student-name">${escapeHtml(s.name || "")}</h3>

 <div class="profile-meta">
 <div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${escapeHtml(s.university || "")}</span></div>
 <div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${escapeHtml(s.region || "")}</span></div>
 <div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${escapeHtml(s.major || "")}</span></div>
 <div class="meta-row"><span class="meta-k">学年：</span><span class="meta-v">${escapeHtml(s.year || "")}</span></div>
 <div class="meta-row"><span class="meta-k">語学力：</span><span class="meta-v">${escapeHtml(s.language || "")}</span></div>
 <div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">${stipendText}</span></div>
 <div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${escapeHtml(s.meeting || "Zoomのみ")}</span></div>
 </div>

 <p class="bio">
 ${escapeHtml(s.bio || "")}
 </p>

 <div class="tagline">
 ${tagsHtml}
 </div>

 <div class="card-actions">
 ${bookingBtn}
 <button class="btn ghost" type="button" data-copy-template>質問例をコピー</button>
 </div>

 <p class="fineprint">${fineprint}</p>

 ${buildLinks(s.links)}
 </div>
 </article>
 `;
 }

 function renderAllStudents() {
 if (!studentListEl) return;
 studentListEl.innerHTML = students.map(studentCardHtml).join("");
 }

 renderAllStudents();

 // -------------------------
 // Search apply (button only)
 // -------------------------
 function normalize(str) {
 return String(str || "").trim().toLowerCase();
 }

 function applyFilters() {
 const keyword = normalize(keywordInput?.value);
 const region = (regionFilter?.value || "").trim();
 const course = (courseFilter?.value || "").trim();

 const cards = Array.from(document.querySelectorAll(".student-card"));
 let visibleCount = 0;

 cards.forEach((card) => {
 const text = normalize(card.innerText);
 const matchKeyword = !keyword || text.includes(keyword);
 const matchRegion = !region || text.includes(region);
 const matchCourse = !course || text.includes(course);

 const show = matchKeyword && matchRegion && matchCourse;
 card.style.display = show ? "block" : "none";
 if (show) visibleCount += 1;
 });

 // show/hide noResults
 if (noResultsEl) {
 noResultsEl.hidden = visibleCount !== 0;
 }

 // if 0, hide list container spacing isn't needed but OK
 return visibleCount;
 }

 function jumpToStudents() {
 document.getElementById("students")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }

 if (searchBtn) {
 searchBtn.addEventListener("click", () => {
 const count = applyFilters();
 jumpToStudents();
 if (count === 0) {
 // 0件ならメッセージを見せる（募集へ誘導）
 // さらに「募集中」表示へユーザー視線が行くようにtoast
 toast("一致する現役生が見つかりませんでした");
 }
 });
 }

 // clear filters
 function clearFilters() {
 if (keywordInput) keywordInput.value = "";
 if (regionFilter) regionFilter.value = "";
 if (courseFilter) courseFilter.value = "";

 // 全表示に戻す
 const cards = Array.from(document.querySelectorAll(".student-card"));
 cards.forEach((c) => (c.style.display = "block"));
 if (noResultsEl) noResultsEl.hidden = true;

 // suggestも消す
 hideSuggest();
 }

 if (clearBtn) clearBtn.addEventListener("click", clearFilters);

 // -------------------------
 // Suggest dropdown (from students.json)
 // -------------------------
 function uniq(arr) {
 return Array.from(new Set(arr.filter(Boolean)));
 }

 function buildSuggestPool() {
 const pool = [];
 students.forEach((s) => {
 pool.push(s.university);
 pool.push(s.region);
 pool.push(s.course);
 pool.push(s.major);
 pool.push(s.year);
 if (Array.isArray(s.tags)) pool.push(...s.tags);
 if (s.stipendium && s.stipendium.has) pool.push(s.stipendium.name || "スティペンディウム・ハンガリカム");
 });
 return uniq(pool.map((x) => String(x).trim()).filter((x) => x.length > 0));
 }

 const suggestPool = buildSuggestPool();

 function hideSuggest() {
 if (!suggestBox) return;
 suggestBox.hidden = true;
 suggestBox.innerHTML = "";
 }

 function showSuggest(items) {
 if (!suggestBox) return;
 if (!items || items.length === 0) {
 hideSuggest();
 return;
 }
 suggestBox.innerHTML = items
 .slice(0, 10)
 .map((t) => {
 const safe = escapeHtml(t);
 return `<div class="suggest-item" data-value="${safe}">${safe}</div>`;
 })
 .join("");
 suggestBox.hidden = false;

 suggestBox.querySelectorAll(".suggest-item").forEach((el) => {
 el.addEventListener("mousedown", (e) => {
 // clickだとblurが先に走って閉じる場合があるのでmousedown
 const v = el.getAttribute("data-value") || "";
 if (keywordInput) keywordInput.value = v;
 hideSuggest();
 });
 });
 }

 function suggestFor(query) {
 const q = normalize(query);
 if (!q) return [];
 return suggestPool.filter((t) => normalize(t).includes(q));
 }

 if (keywordInput) {
 keywordInput.addEventListener("input", () => {
 const items = suggestFor(keywordInput.value);
 showSuggest(items);
 });

 keywordInput.addEventListener("focus", () => {
 const items = suggestFor(keywordInput.value);
 showSuggest(items);
 });

 keywordInput.addEventListener("blur", () => {
 // 少し遅らせてクリック拾う
 setTimeout(hideSuggest, 120);
 });
 }

 // -------------------------
 // FAQ accordion-like behavior
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
 // ※「選んだ瞬間に絞り込み」しない。keywordに入れるだけ。
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
 if (keywordInput) {
 keywordInput.value = u.name; // 入れるだけ
 toast("検索欄に反映しました。検索するを押してください");
 document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }
 });

 wrap.appendChild(btn);
 });

 uniListEl.appendChild(wrap);
 }

 function clearUniversityFilter() {
 if (keywordInput) keywordInput.value = "";
 if (uniListEl) uniListEl.innerHTML = "";
 if (mapHintEl) mapHintEl.style.display = "block";
 hideSuggest();
 }

 if (clearUniBtn) clearUniBtn.addEventListener("click", clearUniversityFilter);

 if (mapToSearchBtn) {
 mapToSearchBtn.addEventListener("click", () => {
 document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "start" });
 toast("検索欄を確認して「検索する」を押してください");
 });
 }

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
});