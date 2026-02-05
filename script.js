document.addEventListener("DOMContentLoaded", () => {
 // -------------------------
 // Search filter
 // -------------------------
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");
 let studentCards = document.querySelectorAll(".student-card");

 function filterStudents() {
 const keyword = (keywordInput?.value || "").trim().toLowerCase();
 const region = regionFilter?.value || "";
 const course = courseFilter?.value || "";

 studentCards.forEach((card) => {
 const text = card.innerText.toLowerCase();
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

 // =========================
 // STUDENTS JSON（ここから追加）
 // =========================
 const studentListEl = document.getElementById("studentList");

 function escapeHtml(str) {
 return String(str)
 .replaceAll("&", "&amp;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;")
 .replaceAll('"', "&quot;")
 .replaceAll("'", "&#039;");
 }

 fetch("students.json")
 .then((res) => {
 if (!res.ok) throw new Error("students.json が読み込めませんでした");
 return res.json();
 })
 .then((students) => {
 if (!studentListEl) return;

 // 現役生カードはJSONから生成する
 studentListEl.innerHTML = "";

 students.forEach((s) => {
 const enabled = !!s.enabled;

 const article = document.createElement("article");
 article.className = "student-card" + (enabled ? "" : " is-disabled");
 article.setAttribute("data-region", s.region || "");
 article.setAttribute("data-course", s.course || "");

 const tagsHtml = Array.isArray(s.tags)
 ? s.tags.map((t) => `<span class="hash">${escapeHtml(t)}</span>`).join("")
 : "";

 const actionHtml = enabled
 ? `<a class="btn" href="${escapeHtml(s.bookingUrl || "#")}" target="_blank" rel="noopener noreferrer">
 空き枠を見る（8,000円 / 60分）
 </a>`
 : `<a class="btn disabled" href="#" aria-disabled="true">空き枠を見る（準備中）</a>`;

 const fineprint = enabled
 ? "※面談はZoomで行います（Meet等は使用しません）。"
 : "※準備が整い次第、予約枠を公開します。";

 article.innerHTML = `
 <div class="profile-image profile-circle">
 <img src="${escapeHtml(s.avatar || "")}" alt="${escapeHtml(s.name || "")}のプロフィール写真（プレースホルダー）" />
 </div>

 <div class="info">
 <h3 class="student-name">${escapeHtml(s.name || "")}</h3>

 <div class="profile-meta">
 <div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${escapeHtml(s.university || "")}</span></div>
 <div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${escapeHtml(s.region || "")}</span></div>
 <div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${escapeHtml(s.major || "")}</span></div>
 <div class="meta-row"><span class="meta-k">語学力：</span><span class="meta-v">${escapeHtml(s.language || "")}</span></div>
 <div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${escapeHtml(s.meeting || "")}</span></div>
 </div>

 <p class="bio">
 ${escapeHtml(s.bio || "").replaceAll("\n", "<br />")}
 </p>

 <div class="tagline">
 ${tagsHtml}
 </div>

 <div class="card-actions">
 ${actionHtml}
 <button class="btn ghost" type="button" data-copy-template>質問例をコピー</button>
 </div>

 <p class="fineprint">${fineprint}</p>
 </div>
 `;

 studentListEl.appendChild(article);
 });

 // JSONで生成した後に、カード一覧を取り直して検索を効かせる
 studentCards = document.querySelectorAll(".student-card");
 filterStudents();
 })
 .catch((err) => {
 console.error(err);
 });
});