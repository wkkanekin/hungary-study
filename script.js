document.addEventListener("DOMContentLoaded", () => {
 // -------------------------
 // Search filter
 // -------------------------
 const keywordInput = document.getElementById("keyword");
 const regionFilter = document.getElementById("regionFilter");
 const courseFilter = document.getElementById("courseFilter");

 // ★ students.json で描画した後も拾えるように「都度取得」にする
 function getStudentCards() {
 return document.querySelectorAll(".student-card");
 }

 function filterStudents() {
 const keyword = (keywordInput?.value || "").trim().toLowerCase();
 const region = regionFilter?.value || "";
 const course = courseFilter?.value || "";

 const studentCards = getStudentCards();

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
 // Students JSON render (NEW) ←★追加
 // -------------------------
 const studentListEl = document.getElementById("studentList");

 function safeText(v) {
 return (v ?? "").toString();
 }

 function setBioWithBreaks(pEl, text) {
 // 改行が入っても <br> で表示できるように
 const t = safeText(text);
 pEl.innerHTML = t.replace(/\n/g, "<br />");
 }

 function createStudentCard(s) {
 const enabled = !!s.enabled;

 const article = document.createElement("article");
 article.className = enabled ? "student-card" : "student-card is-disabled";
 article.setAttribute("data-region", safeText(s.region));
 article.setAttribute("data-course", safeText(s.course));

 // image
 const profileWrap = document.createElement("div");
 profileWrap.className = "profile-image profile-circle";

 const img = document.createElement("img");
 img.src = safeText(s.avatar) || "https://placehold.co/520x520/png?text=Student";
 img.alt = `${safeText(s.name)}のプロフィール写真（プレースホルダー）`;
 profileWrap.appendChild(img);

 // info
 const info = document.createElement("div");
 info.className = "info";

 const name = document.createElement("h3");
 name.className = "student-name";
 name.textContent = safeText(s.name);

 // meta
 const meta = document.createElement("div");
 meta.className = "profile-meta";

 const rows = [
 ["大学：", safeText(s.university)],
 ["地域：", safeText(s.region)],
 ["専攻：", safeText(s.major)],
 ["語学力：", safeText(s.language)],
 ["面談：", safeText(s.meeting)],
 ];

 rows.forEach(([k, v]) => {
 const row = document.createElement("div");
 row.className = "meta-row";

 const kSpan = document.createElement("span");
 kSpan.className = "meta-k";
 kSpan.textContent = k;

 const vSpan = document.createElement("span");
 vSpan.className = "meta-v";
 vSpan.textContent = v;

 row.appendChild(kSpan);
 row.appendChild(vSpan);
 meta.appendChild(row);
 });

 // bio
 const bio = document.createElement("p");
 bio.className = "bio";
 setBioWithBreaks(bio, s.bio);

 // tags
 const tagline = document.createElement("div");
 tagline.className = "tagline";

 const tags = Array.isArray(s.tags) ? s.tags : [];
 tags.forEach((t) => {
 const tag = document.createElement("span");
 tag.className = "hash";
 tag.textContent = safeText(t);
 tagline.appendChild(tag);
 });

 // actions
 const actions = document.createElement("div");
 actions.className = "card-actions";

 const a = document.createElement("a");
 a.className = enabled ? "btn" : "btn disabled";
 a.textContent = enabled ? "空き枠を見る（8,000円 / 60分）" : "空き枠を見る（準備中）";

 if (enabled && s.bookingUrl && s.bookingUrl !== "#") {
 a.href = safeText(s.bookingUrl);
 a.target = "_blank";
 a.rel = "noopener noreferrer";
 } else {
 a.href = "#";
 a.setAttribute("aria-disabled", "true");
 }

 const copyBtn = document.createElement("button");
 copyBtn.className = "btn ghost";
 copyBtn.type = "button";
 copyBtn.setAttribute("data-copy-template", "");
 copyBtn.textContent = "質問例をコピー";

 actions.appendChild(a);
 actions.appendChild(copyBtn);

 // fineprint
 const fine = document.createElement("p");
 fine.className = "fineprint";
 fine.textContent = enabled
 ? "※面談はZoomで行います（Meet等は使用しません）。"
 : "※準備が整い次第、予約枠を公開します。";

 // assemble
 info.appendChild(name);
 info.appendChild(meta);
 info.appendChild(bio);
 info.appendChild(tagline);
 info.appendChild(actions);
 info.appendChild(fine);

 article.appendChild(profileWrap);
 article.appendChild(info);

 return article;
 }

 async function loadAndRenderStudents() {
 if (!studentListEl) return;

 // 一旦空に
 studentListEl.innerHTML = "";

 try {
 const res = await fetch("students.json", { cache: "no-store" });
 if (!res.ok) throw new Error(`students.json load failed: ${res.status}`);
 const students = await res.json();

 if (!Array.isArray(students)) throw new Error("students.json is not an array");

 students.forEach((s) => {
 const card = createStudentCard(s);
 studentListEl.appendChild(card);
 });

 // 描画後にフィルタを適用
 filterStudents();

 // ここで「質問例コピー」ボタンも描画後に効くようにするため、下の処理が動く（※後述で再バインド）
 bindCopyButtons();
 } catch (e) {
 const err = document.createElement("div");
 err.className = "card";
 err.textContent = "現役生データの読み込みに失敗しました（students.jsonを確認してください）";
 studentListEl.appendChild(err);
 console.error(e);
 }
 }

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

 // ★students.jsonでボタンが後から増えるので「関数化して再バインド」できるように
 function bindCopyButtons() {
 document.querySelectorAll("[data-copy-template]").forEach((btn) => {
 // 二重登録防止
 if (btn.dataset.bound === "1") return;
 btn.dataset.bound = "1";

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
 }

 // 初期HTML上のボタン分もバインド
 bindCopyButtons();

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

 // 最後に students.json を読み込んで描画
 loadAndRenderStudents();
});