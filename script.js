// script.js
document.addEventListener("DOMContentLoaded", () => {
 // =========================================================
 // 0) Small helpers
 // =========================================================
 const $ = (id) => document.getElementById(id);

 const esc = (str) =>
 String(str ?? "")
 .replaceAll("&", "&amp;")
 .replaceAll("<", "&lt;")
 .replaceAll(">", "&gt;")
 .replaceAll('"', "&quot;")
 .replaceAll("'", "&#039;");

 const norm = (str) => String(str ?? "").trim().toLowerCase();

 const smoothScrollTo = (hashOrEl) => {
 const el =
 typeof hashOrEl === "string"
 ? document.querySelector(hashOrEl)
 : hashOrEl;
 if (!el) return;
 el.scrollIntoView({ behavior: "smooth", block: "start" });
 };

 // =========================================================
 // 1) Mini TOC
 // =========================================================
 const tocToggle = $("tocToggle");
 const tocPanel = $("tocPanel");

 if (tocToggle && tocPanel) {
 const closeToc = () => {
 tocPanel.classList.remove("open");
 tocToggle.setAttribute("aria-expanded", "false");
 };

 tocToggle.addEventListener("click", () => {
 const open = tocPanel.classList.toggle("open");
 tocToggle.setAttribute("aria-expanded", String(open));
 });

 tocPanel.querySelectorAll("a").forEach((a) => {
 a.addEventListener("click", () => closeToc());
 });

 document.addEventListener("click", (e) => {
 const t = e.target;
 if (!t) return;
 const inside = tocPanel.contains(t) || tocToggle.contains(t);
 if (!inside) closeToc();
 });
 }

 // =========================================================
 // 2) Elements (Search / Students)
 // =========================================================
 const keywordInput = $("keyword");
 const regionFilter = $("regionFilter");
 const courseFilter = $("courseFilter");
 const applySearchBtn = $("applySearch");
 const clearSearchBtn = $("clearSearch");

 const suggestBox = $("suggestBox");

 const studentListEl = $("studentList");
 const noResultsEl = $("noResults");

 // =========================================================
 // 3) Elements (Contact)
 // =========================================================
 const contactGrid = $("contactGrid");
 const openFormBtn = $("openFormBtn");

 // =========================================================
 // 4) Elements (Map)
 // =========================================================
 const mapEl = $("huMap");
 const uniListEl = $("uniList");
 const mapHintEl = $("mapHint");
 const mapStatusEl = $("mapStatus");

 const clearUniBtn = $("clearUniFilter");
 const applyMapSearchBtn = $("applyMapSearch");
 const pickedUniEl = $("pickedUni");

 // =========================================================
 // 5) Elements (Recruit inline form)
 // ※HTML側で以下IDを用意しておく想定（なければ無視される）
 // - recruitOpenBtn : 「申し込みフォームへ」ボタン
 // - recruitFormWrap : 展開するフォーム領域
 // - recruitName / recruitUniversity / recruitYear / recruitEmail / recruitNote
 // - recruitSendBtn : 送信（mailto作成）ボタン
 // - recruitMsg : エラー/案内表示（任意）
 // =========================================================
 const recruitOpenBtn = $("recruitOpenBtn");
 const recruitFormWrap = $("recruitFormWrap");
 const recruitName = $("recruitName");
 const recruitUniversity = $("recruitUniversity");
 const recruitYear = $("recruitYear");
 const recruitEmail = $("recruitEmail");
 const recruitNote = $("recruitNote");
 const recruitSendBtn = $("recruitSendBtn");
 const recruitMsg = $("recruitMsg");

 // =========================================================
 // 6) Data stores
 // =========================================================
 let students = [];
 let suggestPool = [];
 let config = null;

 let pickedUniversityName = "";

 // =========================================================
 // 7) Build search text
 // =========================================================
 const buildSearchText = (stu) => {
 const tags = Array.isArray(stu.tags) ? stu.tags.join(" ") : "";
 const links = Array.isArray(stu.links)
 ? stu.links.map((l) => `${l?.label ?? ""} ${l?.url ?? ""}`).join(" ")
 : "";
 const stip = stu?.stipendium?.has
 ? stu?.stipendium?.name || "stipendium"
 : "";

 return norm(
 [
 stu.name,
 stu.region,
 stu.course,
 stu.university,
 stu.major,
 stu.year,
 stu.language,
 stu.meeting,
 tags,
 links,
 stu.bio,
 stip,
 ].join(" ")
 );
 };

 const isEnabled = (stu) => !!stu.enabled;

 // =========================================================
 // 8) Render students (縦1列でもCSSで制御できるが、JSはそのまま描画)
 // =========================================================
 const renderStudents = (list) => {
 if (!studentListEl) return;

 studentListEl.innerHTML = "";

 if (!list.length) {
 if (noResultsEl) noResultsEl.style.display = "block";
 return;
 }
 if (noResultsEl) noResultsEl.style.display = "none";

 list.forEach((stu) => {
 const disabled = !isEnabled(stu);

 const tagsHtml = (Array.isArray(stu.tags) ? stu.tags : [])
 .map((t) => `<span class="tag">${esc(t)}</span>`)
 .join("");

 const linksHtml = (Array.isArray(stu.links) ? stu.links : [])
 .filter((l) => l && l.label && l.url)
 .map(
 (l) =>
 `<a class="linkPill" href="${esc(
 l.url
 )}" target="_blank" rel="noopener">${esc(l.label)}</a>`
 )
 .join("");

 const stipendiumBadge = stu?.stipendium?.has
 ? `<span class="badgeMini">奨学金：${esc(
 stu?.stipendium?.name || "取得"
 )}</span>`
 : "";

 const bookingBtn = disabled
 ? `<a class="btn" href="#" aria-disabled="true" onclick="return false;">空き枠を見る（準備中）</a>`
 : `<a class="btn primary" href="${esc(
 stu.bookingUrl || "#"
 )}" target="_blank" rel="noopener">空き枠を見る（6,000円 / 40分）</a>`;

 const avatarUrl = stu.avatar || "https://placehold.co/520x520/png?text=Avatar";

 const card = document.createElement("article");
 card.className = `studentCard${disabled ? " disabled" : ""}`;

 card.innerHTML = `
 <div class="studentTop">
 <div class="avatar" aria-label="アバター">
 <img src="${esc(avatarUrl)}" alt="${esc(stu.name)} のアバター" loading="lazy" />
 </div>
 <div>
 <p class="studentName">${esc(stu.name)}</p>
 <p class="studentMeta">${esc(stu.university)} / ${esc(stu.region)} / ${esc(stu.course)}</p>
 </div>
 </div>

 ${stipendiumBadge ? `<div>${stipendiumBadge}</div>` : ""}

 <div class="metaBox" aria-label="プロフィール情報">
 <div class="metaRow"><span class="metaK">大学</span><span class="metaV">${esc(stu.university)}</span></div>
 <div class="metaRow"><span class="metaK">地域</span><span class="metaV">${esc(stu.region)}</span></div>
 <div class="metaRow"><span class="metaK">専攻</span><span class="metaV">${esc(stu.major || "")}</span></div>
 <div class="metaRow"><span class="metaK">学年</span><span class="metaV">${esc(stu.year || "")}</span></div>
 <div class="metaRow"><span class="metaK">語学</span><span class="metaV">${esc(stu.language || "")}</span></div>
 <div class="metaRow"><span class="metaK">面談</span><span class="metaV">${esc(stu.meeting || "")}</span></div>
 </div>

 ${stu.bio ? `<p class="bio">${esc(stu.bio)}</p>` : ""}

 ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}

 ${linksHtml ? `<div class="linkList" aria-label="外部リンク">${linksHtml}</div>` : ""}

 ${bookingBtn}
 `;

 studentListEl.appendChild(card);
 });
 };

 // =========================================================
 // 9) Filter + jump to students
 // =========================================================
 const applyFilterAndJump = () => {
 const kw = norm(keywordInput?.value);
 const region = regionFilter?.value || "";
 const course = courseFilter?.value || "";

 const filtered = students.filter((stu) => {
 const text = buildSearchText(stu);
 const okKw = !kw || text.includes(kw);
 const okRegion = !region || String(stu.region) === region;
 const okCourse = !course || String(stu.course) === course;
 return okKw && okRegion && okCourse;
 });

 renderStudents(filtered);
 smoothScrollTo("#students");

 // 0件なら、募集への導線が出るのはHTML側（#noResults）で制御
 // ※必要ならここで追加表示もできるが、今回はHTML側に任せる
 };

 const clearSearch = () => {
 if (keywordInput) keywordInput.value = "";
 if (regionFilter) regionFilter.value = "";
 if (courseFilter) courseFilter.value = "";
 closeSuggest();
 renderStudents(students);
 };

 // =========================================================
 // 10) Suggest dropdown
 // =========================================================
 const openSuggest = () => {
 if (!suggestBox) return;
 suggestBox.classList.add("open");
 };

 const closeSuggest = () => {
 if (!suggestBox) return;
 suggestBox.classList.remove("open");
 suggestBox.innerHTML = "";
 };

 const buildSuggestPool = (studentsArr) => {
 const set = new Set();

 studentsArr.forEach((s) => {
 if (s.university) set.add(String(s.university));
 if (s.region) set.add(String(s.region));
 if (s.course) set.add(String(s.course));
 if (Array.isArray(s.tags)) s.tags.forEach((t) => set.add(String(t)));
 if (Array.isArray(s.links)) s.links.forEach((l) => l?.label && set.add(String(l.label)));
 });

 ["奨学金", "Stipendium", "スティペンディウム", "出願", "生活費", "住まい", "治安"].forEach((w) =>
 set.add(w)
 );

 return Array.from(set);
 };

 const renderSuggest = (query) => {
 if (!suggestBox) return;
 const q = norm(query);
 if (!q) {
 closeSuggest();
 return;
 }

 const hits = suggestPool
 .map((s) => ({ raw: s, n: norm(s) }))
 .filter((x) => x.n.includes(q))
 .slice(0, 8);

 if (!hits.length) {
 closeSuggest();
 return;
 }

 suggestBox.innerHTML = "";
 hits.forEach((h) => {
 const item = document.createElement("div");
 item.className = "suggestItem";
 item.innerHTML = `${esc(h.raw)}<span class="suggestMeta">クリックで入力</span>`;
 item.addEventListener("click", () => {
 if (keywordInput) keywordInput.value = h.raw;
 closeSuggest();
 keywordInput?.focus();
 });
 suggestBox.appendChild(item);
 });

 openSuggest();
 };

 document.addEventListener("click", (e) => {
 const t = e.target;
 if (!t) return;
 const inside = (suggestBox && suggestBox.contains(t)) || (keywordInput && keywordInput.contains(t));
 if (!inside) closeSuggest();
 });

 if (keywordInput) {
 keywordInput.addEventListener("input", () => renderSuggest(keywordInput.value));
 keywordInput.addEventListener("focus", () => renderSuggest(keywordInput.value));
 }

 // =========================================================
 // 11) Load JSON
 // =========================================================
 const loadStudents = async () => {
 const res = await fetch("students.json", { cache: "no-store" });
 if (!res.ok) throw new Error("students.json が読み込めません: " + res.status);
 const data = await res.json();
 if (!Array.isArray(data)) throw new Error("students.json の形式が不正です（配列にしてください）");

 students = data;

 // suggest pool
 suggestPool = buildSuggestPool(students);

 // initial render
 renderStudents(students);
 };

 const iconSvg = (name) => {
 // シンプルなインラインSVG（外部依存なし）
 // config.json の label に応じて出し分け
 const n = norm(name);
 if (n.includes("youtube")) {
 return `
 <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
 <path d="M21.6 7.2c-.2-1.1-.9-2-2-2.2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.4c-1.1.2-1.8 1.1-2 2.2C2 9 2 12 2 12s0 3 .4 4.8c.2 1.1.9 2 2 2.2 1.8.4 7.6.4 7.6.4s5.8 0 7.6-.4c1.1-.2 1.8-1.1 2-2.2.4-1.8.4-4.8.4-4.8s0-3-.4-4.8z"></path>
 <path d="M10 15.5v-7l6 3.5-6 3.5z" fill="white"></path>
 </svg>
 `;
 }
 if (n.includes("instagram")) {
 return `
 <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
 <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"></path>
 <path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path>
 <path d="M17.5 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path>
 </svg>
 `;
 }
 if (n === "x" || n.includes("twitter")) {
 return `
 <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
 <path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.5L6.2 22H3l7.3-8.4L1 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z"></path>
 </svg>
 `;
 }
 if (n.includes("note")) {
 return `
 <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
 <path d="M6 4h12v16H6V4zm2 2v12h8V6H8z"></path>
 </svg>
 `;
 }
 if (n.includes("facebook")) {
 return `
 <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
 <path d="M13 22v-8h3l1-4h-4V7.5c0-1.2.4-2 2-2H17V2.2C16.5 2.1 15.3 2 14 2c-2.8 0-5 1.7-5 5v3H6v4h3v8h4z"></path>
 </svg>
 `;
 }
 // default
 return `
 <svg viewBox="0 0 24 24" aria-hidden="true" width="22" height="22">
 <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2zm1 14h-2v-2h2v2zm0-4h-2V6h2v6z"></path>
 </svg>
 `;
 };

 const loadConfig = async () => {
 const res = await fetch("config.json", { cache: "no-store" });
 if (!res.ok) throw new Error("config.json が読み込めません: " + res.status);
 config = await res.json();

 // Form button (external)
 if (openFormBtn) openFormBtn.href = config?.formUrl || "#";

 // Contact grid
 if (contactGrid) {
 contactGrid.innerHTML = "";

 // Email
 const email = config?.email || "";
 const emailCard = document.createElement("a");
 emailCard.className = "contactItem";
 emailCard.href = email ? `mailto:${encodeURIComponent(email)}` : "#";
 emailCard.innerHTML = `
 <div class="contactTop">
 <div class="contactIcon">${iconSvg("email")}</div>
 <div class="contactK">メール</div>
 </div>
 <div class="contactV">${esc(email || "設定中")}</div>
 `;
 contactGrid.appendChild(emailCard);

 // Socials
 const socials = Array.isArray(config?.socials) ? config.socials : [];
 socials.forEach((s) => {
 const a = document.createElement("a");
 a.className = "contactItem";
 a.href = s?.url || "#";
 a.target = "_blank";
 a.rel = "noopener";
 a.innerHTML = `
 <div class="contactTop">
 <div class="contactIcon">${iconSvg(s?.label || "sns")}</div>
 <div class="contactK">${esc(s?.label || "SNS")}</div>
 </div>
 <div class="contactV">${esc(s?.url || "設定中")}</div>
 `;
 contactGrid.appendChild(a);
 });
 }
 };

 // =========================================================
 // 12) Search buttons
 // =========================================================
 if (applySearchBtn) applySearchBtn.addEventListener("click", applyFilterAndJump);
 if (clearSearchBtn) clearSearchBtn.addEventListener("click", clearSearch);

 // =========================================================
 // 13) Map: Leaflet (cities -> universities list)
 // =========================================================
 const cityCoords = {
 ブダペスト: { lat: 47.4979, lng: 19.0402 },
 デブレツェン: { lat: 47.5316, lng: 21.6273 },
 セゲド: { lat: 46.253, lng: 20.1414 },
 ペーチ: { lat: 46.0727, lng: 18.2323 },
 ミシュコルツ: { lat: 48.1035, lng: 20.7784 },
 ショプロン: { lat: 47.6817, lng: 16.5845 },
 ジェール: { lat: 47.6875, lng: 17.6504 },
 ヴェスプレーム: { lat: 47.093, lng: 17.911 },
 ニーレジハーザ: { lat: 47.9554, lng: 21.7167 },
 ドゥナウーイヴァーロシュ: { lat: 46.9619, lng: 18.9355 },
 ケチケメート: { lat: 46.8964, lng: 19.6897 },
 ギョドゥルー: { lat: 47.5966, lng: 19.3552 },
 エゲル: { lat: 47.9025, lng: 20.3772 },
 シャーロシュパタク: { lat: 48.3245, lng: 21.5686 },
 ヴァーツ: { lat: 47.7785, lng: 19.128 },
 バヤ: { lat: 46.1803, lng: 18.9567 },
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
 { name: "Kodály Institute", city: "ケチケメート" },
 ];

 const groupByCity = (items) => {
 const m = new Map();
 items.forEach((u) => {
 if (!m.has(u.city)) m.set(u.city, []);
 m.get(u.city).push(u);
 });
 return m;
 };

 const setPickedUniversity = (name) => {
 pickedUniversityName = name || "";
 if (pickedUniEl) pickedUniEl.textContent = pickedUniversityName || "未選択";
 };

 const showClearUniButton = (show) => {
 if (!clearUniBtn) return;
 clearUniBtn.style.display = show ? "inline-flex" : "none";
 };

 const renderUniversityList = (city, list) => {
 if (!uniListEl) return;

 // hint off
 if (mapHintEl) mapHintEl.style.display = "none";

 uniListEl.innerHTML = "";

 const group = document.createElement("div");
 group.className = "uniGroup";

 const head = document.createElement("div");
 head.className = "uniCity";
 head.textContent = `${city}（${list.length}校）`;
 group.appendChild(head);

 list.forEach((u) => {
 const btn = document.createElement("button");
 btn.type = "button";
 btn.className = "uniBtn";
 btn.textContent = u.name;

 btn.addEventListener("click", () => {
 setPickedUniversity(u.name);
 if (keywordInput) keywordInput.value = u.name;
 closeSuggest();
 applyFilterAndJump(); // 大学クリック → 即検索＆現役生へ
 });

 group.appendChild(btn);
 });

 uniListEl.appendChild(group);

 // 大学一覧が出た瞬間だけ「検索条件をクリア」を表示
 showClearUniButton(true);
 };

 const clearUniversityList = () => {
 setPickedUniversity("");
 if (uniListEl) uniListEl.innerHTML = "";
 if (mapHintEl) mapHintEl.style.display = "block";

 // 大学一覧が消えたら「検索条件をクリア」も隠す
 showClearUniButton(false);
 };

 if (clearUniBtn) {
 clearUniBtn.addEventListener("click", () => {
 clearUniversityList();
 });
 }

 if (applyMapSearchBtn) {
 applyMapSearchBtn.addEventListener("click", () => {
 // 「検索する」押下でも同じ挙動にする
 if (pickedUniversityName && keywordInput) {
 keywordInput.value = pickedUniversityName;
 }
 closeSuggest();
 applyFilterAndJump();
 });
 }

 const initMap = () => {
 if (!mapEl || !window.L) return;

 if (mapStatusEl) mapStatusEl.textContent = "準備中…";

 const huMap = L.map("huMap", { scrollWheelZoom: false });
 huMap.setView([47.1625, 19.5033], 7);

 L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
 attribution: "&copy; OpenStreetMap contributors",
 maxZoom: 18,
 }).addTo(huMap);

 const byCity = groupByCity(universities);

 let cityCount = 0;
 byCity.forEach((list, city) => {
 const c = cityCoords[city];
 if (!c) return;

 const marker = L.circleMarker([c.lat, c.lng], {
 radius: 8,
 weight: 2,
 fillOpacity: 0.7,
 }).addTo(huMap);

 marker.bindTooltip(`${city}（${list.length}）`, { direction: "top" });

 marker.on("mouseover", () =>
 marker.setStyle({ radius: 12, weight: 3, fillOpacity: 0.9 })
 );
 marker.on("mouseout", () =>
 marker.setStyle({ radius: 8, weight: 2, fillOpacity: 0.7 })
 );

 marker.on("click", () => {
 renderUniversityList(city, list);
 // クリックしたら地図セクションに留める（大学クリックで検索＆移動するため）
 // smoothScrollTo("#mapSearch");
 });

 cityCount++;
 });

 if (mapStatusEl) {
 mapStatusEl.textContent = `都市：${cityCount} / 大学：${universities.length}`;
 }

 // 初期状態：大学一覧が無いのでクリアボタンは隠す
 showClearUniButton(false);
 };

 // =========================================================
 // 14) Recruit inline form (mailto draft)
 // =========================================================
 const setRecruitMsg = (text) => {
 if (!recruitMsg) return;
 recruitMsg.textContent = text || "";
 };

 const openRecruitForm = () => {
 if (!recruitFormWrap) return;
 recruitFormWrap.style.display = "block";
 smoothScrollTo(recruitFormWrap);
 };

 const closeRecruitForm = () => {
 if (!recruitFormWrap) return;
 recruitFormWrap.style.display = "none";
 };

 if (recruitOpenBtn) {
 recruitOpenBtn.addEventListener("click", (e) => {
 e.preventDefault();
 // トグルでもOKだが、今回は確実に開く
 openRecruitForm();
 });
 }

 if (recruitSendBtn) {
 recruitSendBtn.addEventListener("click", (e) => {
 e.preventDefault();

 const to = config?.email || "";
 if (!to) {
 setRecruitMsg("送信先メール（config.json の email）が未設定です。");
 return;
 }

 const name = (recruitName?.value || "").trim();
 const uni = (recruitUniversity?.value || "").trim();
 const year = (recruitYear?.value || "").trim();
 const email = (recruitEmail?.value || "").trim();
 const note = (recruitNote?.value || "").trim();

 if (!name || !uni || !year || !email) {
 setRecruitMsg("必須項目（名前・大学・学年・メール）を入力してください。");
 return;
 }

 setRecruitMsg("");

 const subject = "【現役生参加希望】申し込みフォーム";
 const bodyLines = [
 "現役生として参加希望です。",
 "",
 "【入力内容】",
 `・名前（表示名）：${name}`,
 `・大学名：${uni}`,
 `・学年・課程：${year}`,
 `・メールアドレス：${email}`,
 `・自由記述：${note || "（なし）"}`,
 "",
 "※ まずは簡単な情報だけで大丈夫です。内容を確認後、こちらから詳しくご連絡いたします。",
 ];
 const body = bodyLines.join("\n");

 const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
 subject
 )}&body=${encodeURIComponent(body)}`;

 // メーラーを開く（下書き）
 window.location.href = mailto;
 });
 }

 // =========================================================
 // 15) Boot
 // =========================================================
 (async () => {
 try {
 await Promise.all([loadStudents(), loadConfig()]);
 initMap();
 // 大学一覧は初期クリア
 clearUniversityList();
 } catch (e) {
 console.error(e);

 // map status fallback
 if (mapStatusEl) mapStatusEl.textContent = "読み込み失敗";

 // student list fallback
 if (studentListEl) {
 studentListEl.innerHTML = `
 <div class="card" style="padding:16px">
 <div style="font-weight:950;color:#0f2a5a">読み込みに失敗しました</div>
 <div class="muted" style="font-weight:850;margin-top:6px">
 students.json / config.json の配置・ファイル名・GitHub Pages のパスを確認してください。
 </div>
 </div>
 `;
 }
 }
 })();
});