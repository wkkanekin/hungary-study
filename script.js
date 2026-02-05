document.addEventListener("DOMContentLoaded", () => {
 // -------------------------
 // Helpers (safe HTML)
 // -------------------------
 function escapeHtml(input) {
 const s = String(input ?? "");
 return s
 .replaceAll("&", "&amp;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;")
 .replaceAll('"', "&quot;")
 .replaceAll("'", "&#039;");
 }

 function escapeAttr(input) {
 // href/src用：最低限のエスケープ
 const s = String(input ?? "");
 return s
 .replaceAll("&", "&amp;")
 .replaceAll('"', "&quot;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;");
 }

 // -------------------------
 // Search filter
 // -------------------------
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");

 function filterStudents() {
 const keyword = (keywordInput?.value || "").trim().toLowerCase();
 const region = regionFilter?.value || "";
 const course = courseFilter?.value || "";

 // ★学生カードはJS生成なので、毎回取り直す（ここが重要）
 const studentCards = document.querySelectorAll(".student-card");

 studentCards.forEach((card) => {
 const text = (card.innerText || "").toLowerCase();
 const matchKeyword = !keyword || text.includes(keyword);
 const matchRegion = !region || text.includes(region);
 const matchCourse = !course || text.includes(course);
 card.style.display = matchKeyword && matchRegion && matchCourse ? "block" : "none";
 });
 }

 if (keywordInput) keywordInput.addEventListener("input", filterStudents);
 if (regionFilter) regionFilter.addEventListener("change", filterStudents);
 if (courseFilter) courseFilter.addEventListener("change", filterStudents);

 // -------------------------
 // Copy question template
 // -------------------------
 const templateEl = document.getElementById("questionTemplate");

 async function copyToClipboard(text) {
 try {
 await navigator.clipboard.writeText(text);
 return true;
 } catch (e) {
 // Fallback for older browsers / insecure contexts
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
 // Students (JSON -> Cards) ★ここがメイン変更点
 // -------------------------
 const studentListEl = document.getElementById("studentList");

 function buildStudentCard(s) {
 const region = s.region || "";
 const course = s.course || "";
 const isEnabled = !!s.enabled;

 const metaRows = [];

 // 大学
 if (s.university) {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${escapeHtml(s.university)}</span></div>`
 );
 }
 // 地域
 if (s.region) {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${escapeHtml(s.region)}</span></div>`
 );
 }
 // 専攻
 if (s.major) {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${escapeHtml(s.major)}</span></div>`
 );
 }
 // 学年（NEW）
 if (s.year) {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">学年：</span><span class="meta-v">${escapeHtml(s.year)}</span></div>`
 );
 }
 // 語学
 if (s.language) {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">語学力：</span><span class="meta-v">${escapeHtml(s.language)}</span></div>`
 );
 }
 // 面談
 if (s.meeting) {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${escapeHtml(s.meeting)}</span></div>`
 );
 }
 // 奨学金（NEW）
 if (s.stipendium && typeof s.stipendium.has === "boolean") {
 if (s.stipendium.has) {
 const nm = s.stipendium.name ? s.stipendium.name : "奨学金あり";
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">${escapeHtml(nm)}</span></div>`
 );
 } else {
 metaRows.push(
 `<div class="meta-row"><span class="meta-k">奨学金：</span><span class="meta-v">なし</span></div>`
 );
 }
 }

 const tags = Array.isArray(s.tags) ? s.tags : [];
 const tagsHtml = tags
 .filter(t => String(t || "").trim().length > 0)
 .map(t => `<span class="hash">${escapeHtml(t)}</span>`)
 .join("");

 // 外部リンク（NEW）
 let linksHtml = "";
 if (Array.isArray(s.links) && s.links.length > 0) {
 const btns = s.links
 .filter(l => l && l.label && l.url)
 .map(l => {
 const label = escapeHtml(l.label);
 const url = escapeAttr(l.url);
 return `<a class="ext-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
 })
 .join("");

 if (btns.trim().length > 0) {
 linksHtml = `
 <div class="ext-links">
 <div class="ext-title">その他（外部リンク）</div>
 <div class="ext-buttons">${btns}</div>
 </div>
 `;
 }
 }

 // 予約ボタン
 const bookingUrl = s.bookingUrl || "#";
 const bookingBtn = isEnabled
 ? `<a class="btn" href="${escapeAttr(bookingUrl)}" target="_blank" rel="noopener noreferrer">空き枠を見る（8,000円 / 60分）</a>`
 : `<a class="btn disabled" href="#" aria-disabled="true">空き枠を見る（準備中）</a>`;

 // fineprint
 const fineprint = isEnabled
 ? `※面談はZoomで行います（Meet等は使用しません）。`
 : `※準備が整い次第、予約枠を公開します。`;

 const avatar = s.avatar || "https://placehold.co/520x520/png?text=Student";
 const name = s.name || "名前（未設定）";

 return `
 <article class="student-card ${isEnabled ? "" : "is-disabled"}" data-region="${escapeAttr(region)}" data-course="${escapeAttr(course)}">
 <div class="profile-image profile-circle">
 <img src="${escapeAttr(avatar)}" alt="${escapeAttr(name)}のプロフィール写真（プレースホルダー）" />
 </div>

 <div class="info">
 <h3 class="student-name">${escapeHtml(name)}</h3>

 <div class="profile-meta">
 ${metaRows.join("")}
 </div>

 <p class="bio">
 ${escapeHtml(s.bio || "").replaceAll("\n", "<br />")}
 </p>

 <div class="tagline">
 ${tagsHtml}
 </div>

 ${linksHtml}

 <div class="card-actions">
 ${bookingBtn}
 <button class="btn ghost" type="button" data-copy-template>質問例をコピー</button>
 </div>

 <p class="fineprint">${fineprint}</p>
 </div>
 </article>
 `;
 }

 function renderStudents(students) {
 if (!studentListEl) return;
 studentListEl.innerHTML = "";

 const list = Array.isArray(students) ? students : [];
 const enabledFirst = [...list].sort((a, b) => Number(!!b.enabled) - Number(!!a.enabled));

 const html = enabledFirst.map(buildStudentCard).join("");
 studentListEl.innerHTML = html;

 // 学生カード生成後に、コピーイベントが新DOMに効くよう付け直し
 studentListEl.querySelectorAll("[data-copy-template]").forEach((btn) => {
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

 // 初期状態でフィルタ反映（検索欄が残ってる場合にも対応）
 filterStudents();
 }

 async function loadStudents() {
 try {
 const res = await fetch("students.json", { cache: "no-store" });
 if (!res.ok) throw new Error(`students.json load failed: ${res.status}`);
 const data = await res.json();
 renderStudents(data);
 } catch (e) {
 console.error(e);
 if (studentListEl) {
 studentListEl.innerHTML = `
 <div class="card soft">
 <p class="para">
 学生データの読み込みに失敗しました。<br />
 students.json が同じ階層にあるか、JSONのカンマや括弧が壊れていないか確認してください。
 </p>
 </div>
 `;
 }
 }
 }

 loadStudents();

 // -------------------------
 // Map-based university search (Leaflet) - NEW
 // -------------------------
 const mapEl = document.getElementById("huMap");
 const uniListEl = document.getElementById("uniList");
 const mapHintEl = document.getElementById("mapHint");
 const clearUniBtn = document.getElementById("clearUniFilter");

 // ざっくり都市座標（大学は都市に紐づけ）
 // ※必要ならあとで精度上げればOK
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

 // 大学データ（都市に紐づく）
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
 // 既存検索欄に流し込み → 既存filterで絞り込み
 if (keywordInput) {
 keywordInput.value = u.name;
 filterStudents();
 document.getElementById("search")?.scrollIntoView({ behavior: "smooth", block: "start" });
 }
 });

 wrap.appendChild(btn);
 });

 uniListEl.appendChild(wrap);
 }

 function clearUniversityFilter() {
 if (keywordInput) {
 keywordInput.value = "";
 filterStudents();
 }
 if (uniListEl) uniListEl.innerHTML = "";
 if (mapHintEl) mapHintEl.style.display = "block";
 }

 if (clearUniBtn) clearUniBtn.addEventListener("click", clearUniversityFilter);

 // 地図を置く要素がある場合のみ起動
 if (mapEl && window.L) {
 const huMap = L.map("huMap", {
 scrollWheelZoom: false, // LPなので誤操作防止
 });

 // 表示範囲：ハンガリー周辺
 huMap.setView([47.1625, 19.5033], 7);

 // タイル（無料）
 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 attribution: "&copy; OpenStreetMap contributors",
 }).addTo(huMap);

 const byCity = groupByCity(universities);

 // 都市ごとに「円マーカー」を置く（ホバーで誇張）
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

 // 都市クリック時に「地域フィルタ」も合わせたい場合はここをON
 // if (regionFilter) {
 // regionFilter.value = city;
 // filterStudents();
 // }
 });
 });
 }
});