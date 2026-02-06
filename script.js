// script.js
document.addEventListener("DOMContentLoaded", () => {
// =========================
// Mini TOC
// =========================
const tocToggle = document.getElementById("tocToggle");
const tocPanel = document.getElementById("tocPanel");

if (tocToggle && tocPanel) {
tocToggle.addEventListener("click", () => {
tocPanel.classList.toggle("open");
});
tocPanel.querySelectorAll("a").forEach((a) => {
a.addEventListener("click", () => tocPanel.classList.remove("open"));
});
document.addEventListener("click", (e) => {
const within = e.target.closest(".mini-toc");
if (!within) tocPanel.classList.remove("open");
});
}

// =========================
// Elements
// =========================
const keywordInput = document.getElementById("keyword");
const regionFilter = document.getElementById("regionFilter");
const courseFilter = document.getElementById("courseFilter");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");

const suggestBox = document.getElementById("suggestBox"); // (optional if present)
// NOTE: index.html の最新版は suggestBox を置いてないけど、置いてもOK。未配置でも動くようにしてる。

const studentListEl = document.getElementById("studentList");
const universityListEl = document.getElementById("universityList");

// recruit form
const openFormBtn = document.getElementById("openForm");
const applyForm = document.getElementById("applyForm");

// =========================
// Load JSON
// =========================
let STUDENTS = [];
let CONFIG = null;

async function loadJson(path) {
const res = await fetch(path, { cache: "no-store" });
if (!res.ok) throw new Error(`Failed to load ${path}: ${res.status}`);
return await res.json();
}

function uniq(arr) {
return Array.from(new Set(arr)).filter(Boolean);
}

function escapeHtml(str) {
return String(str)
.replaceAll("&", "&amp;")
.replaceAll("<", "&lt;")
.replaceAll(">", "&gt;")
.replaceAll('"', "&quot;")
.replaceAll("'", "&#039;");
}

// =========================
// Populate filters from students.json
// =========================
function buildFilters(students) {
if (!regionFilter || !courseFilter) return;

const regions = uniq(students.map((s) => s.region));
const courses = uniq(students.map((s) => s.course));

regionFilter.innerHTML = `<option value="">地域指定</option>` + regions
.map((r) => `<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`)
.join("");

courseFilter.innerHTML = `<option value="">分野指定</option>` + courses
.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
.join("");
}

// =========================
// Suggest (dropdown) from students data
// =========================
let SUGGEST_POOL = [];

function buildSuggestPool(students) {
const pool = [];
students.forEach((s) => {
pool.push(s.university, s.region, s.course, s.major, s.year);
(s.tags || []).forEach((t) => pool.push(t));
(s.links || []).forEach((l) => pool.push(l.label));
});
SUGGEST_POOL = uniq(pool).sort((a, b) => String(a).localeCompare(String(b), "ja"));
}

function ensureSuggestBox() {
// index.html に suggestBox が無い場合は自動で作って keyword の下に差し込む
if (document.getElementById("suggestBox")) return document.getElementById("suggestBox");
if (!keywordInput) return null;

const wrap = document.createElement("div");
wrap.className = "suggest-wrap";
keywordInput.parentNode.insertBefore(wrap, keywordInput);
wrap.appendChild(keywordInput);

const box = document.createElement("div");
box.id = "suggestBox";
box.setAttribute("role", "listbox");
wrap.appendChild(box);
return box;
}

function showSuggest(items) {
const box = ensureSuggestBox();
if (!box) return;

if (!items.length) {
box.classList.remove("open");
box.innerHTML = "";
return;
}
box.innerHTML = items.slice(0, 8)
.map((t) => `<div class="suggest-item" data-value="${escapeHtml(t)}">${escapeHtml(t)}</div>`)
.join("");
box.classList.add("open");

box.querySelectorAll(".suggest-item").forEach((it) => {
it.addEventListener("click", () => {
const v = it.getAttribute("data-value") || "";
keywordInput.value = v;
box.classList.remove("open");
});
});
}

function bindSuggest() {
if (!keywordInput) return;
const box = ensureSuggestBox();

keywordInput.addEventListener("input", () => {
const q = (keywordInput.value || "").trim().toLowerCase();
if (!q) return showSuggest([]);
const hits = SUGGEST_POOL.filter((t) => String(t).toLowerCase().includes(q));
showSuggest(hits);
});

document.addEventListener("click", (e) => {
const within = e.target.closest(".suggest-wrap");
if (!within && box) box.classList.remove("open");
});
}

// =========================
// Render students (vertical + centered)
// =========================
function renderNoResults() {
if (!studentListEl) return;
studentListEl.innerHTML = `
<div class="student-card no-results">
<p style="margin:0;font-weight:950;color:#0f2a5a">現在、該当する現役生が見つかりませんでした。</p>
<p style="margin:10px 0 0;" class="muted">
現役生は順次追加予定です。<br />
現役生として参加したい方は <a href="#recruit">現役生募集</a> をご確認ください。
</p>
</div>
`;
}

function renderStudents(list) {
if (!studentListEl) return;
studentListEl.innerHTML = "";

if (!list.length) {
renderNoResults();
return;
}

list.forEach((s) => {
const enabled = !!s.enabled;
const avatarLetter = (s.name || "").trim().slice(0, 1) || "H";

const stipendiumLine = (s.stipendium && s.stipendium.has)
? ` / 奨学金：${escapeHtml(s.stipendium.name || "あり")}`
: "";

const links = (s.links || []).map((l) => {
const label = escapeHtml(l.label || "リンク");
const url = escapeHtml(l.url || "#");
return `<a class="student-link" href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
}).join("");

const booking = enabled && s.bookingUrl && s.bookingUrl !== "#"
? `<a class="student-link primary" href="${escapeHtml(s.bookingUrl)}" target="_blank" rel="noopener noreferrer">空き枠を見る（6,000円 / 40分）</a>`
: `<span class="student-link" style="opacity:.65; cursor:not-allowed">空き枠を見る（準備中）</span>`;

const el = document.createElement("article");
el.className = "student-card";
el.dataset.region = s.region || "";
el.dataset.course = s.course || "";

el.innerHTML = `
<div class="student-top">
<div class="student-avatar" aria-label="アバター">
${s.avatar ? `<img src="${escapeHtml(s.avatar)}" alt="${escapeHtml(s.name || "avatar")}">` : escapeHtml(avatarLetter)}
</div>
<div>
<p class="student-name">${escapeHtml(s.name || "")}</p>
<p class="student-meta">
${escapeHtml(s.university || "")} / ${escapeHtml(s.region || "")} / ${escapeHtml(s.course || "")}
${s.year ? ` / ${escapeHtml(s.year)}` : ""}
${stipendiumLine}
</p>
</div>
</div>

<p class="student-bio">${escapeHtml(s.bio || "")}</p>

<div class="student-tags">
${(s.tags || []).map((t) => `<span class="student-tag">${escapeHtml(t)}</span>`).join("")}
</div>

<div class="student-links">
${booking}
${links}
</div>
`;
studentListEl.appendChild(el);
});
}

function applyFilter() {
const kw = (keywordInput?.value || "").trim().toLowerCase();
const r = regionFilter?.value || "";
const c = courseFilter?.value || "";

const filtered = STUDENTS
.filter((s) => true) // keep even disabled to show "準備中"
.filter((s) => {
const blob = [
s.name, s.region, s.course, s.university, s.major, s.year,
s.language, s.meeting, s.bio,
...(s.tags || []),
...(s.links || []).map((l) => l.label),
...(s.links || []).map((l) => l.url),
s.stipendium?.name
].filter(Boolean).join(" ").toLowerCase();

const okKw = !kw || blob.includes(kw);
const okR = !r || String(s.region || "") === r;
const okC = !c || String(s.course || "") === c;
return okKw && okR && okC;
});

renderStudents(filtered);

// 検索結果が表示されたら students にスクロール
// （search セクション内に結果があるのでここでは不要だが、要望通り“検索したら結果へ”）
studentListEl?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clearFilter() {
if (keywordInput) keywordInput.value = "";
if (regionFilter) regionFilter.value = "";
if (courseFilter) courseFilter.value = "";
renderStudents(STUDENTS);
}

// =========================
// Contact from config.json
// =========================
function renderContact(cfg) {
const wrap = document.getElementById("contactLinks");
if (!wrap || !cfg) return;

const items = [];

if (cfg.email) {
items.push({
label: "メール",
value: cfg.email,
url: `mailto:${cfg.email}`
});
}

(cfg.socials || []).forEach((s) => {
items.push({
label: s.label || "SNS",
value: s.url || "",
url: s.url || "#"
});
});

if (cfg.formUrl) {
items.push({
label: "フォーム",
value: cfg.formUrl,
url: cfg.formUrl
});
}

wrap.innerHTML = items.map((it) => `
<a class="contact-item" href="${escapeHtml(it.url)}" target="_blank" rel="noopener noreferrer">
<span class="contact-label">${escapeHtml(it.label)}</span>
<span class="contact-value">${escapeHtml(it.value)}</span>
</a>
`).join("");
}

// =========================
// Recruit inline form behavior (mailto fallback)
// =========================
function bindRecruitForm() {
if (openFormBtn && applyForm) {
openFormBtn.addEventListener("click", () => {
applyForm.classList.toggle("open");
if (applyForm.classList.contains("open")) {
applyForm.scrollIntoView({ behavior: "smooth", block: "start" });
}
});
}

if (applyForm) {
applyForm.addEventListener("submit", (e) => {
e.preventDefault();

const inputs = applyForm.querySelectorAll("input, textarea");
const values = Array.from(inputs).map((el) => el.value || "");

const name = values[0] || "";
const uni = values[1] || "";
const year = values[2] || "";
const email = values[3] || "";
const note = values[4] || "";

// 送信先が無い場合でも落ちないように
const to = (CONFIG && CONFIG.email) ? CONFIG.email : "contact@example.com";

const subject = encodeURIComponent("【現役生参加申し込み】");
const body = encodeURIComponent(
`名前（表示名）：${name}\n` +
`大学名：${uni}\n` +
`学年・課程：${year}\n` +
`メールアドレス：${email}\n` +
`自由記述：\n${note}\n`
);

// mailtoで運営へ送れるようにする（サーバ不要）
window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
});
}
}

// =========================
// Map: Overpass (all universities) + list large + "この大学で検索"
// =========================
let map = null;
let markersLayer = null;
let universitiesCache = []; // {name, website, lat, lon}

function initMap() {
const mapEl = document.getElementById("map");
if (!mapEl || !window.L) return;

map = L.map("map", { scrollWheelZoom: false }).setView([47.1625, 19.5033], 7);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
maxZoom: 19,
attribution: "&copy; OpenStreetMap contributors",
}).addTo(map);

markersLayer = L.layerGroup().addTo(map);

loadUniversitiesFromOverpass();
}

async function loadUniversitiesFromOverpass() {
const overpassUrl = "https://overpass-api.de/api/interpreter";

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
const res = await fetch(overpassUrl, {
method: "POST",
headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
body: "data=" + encodeURIComponent(query),
});

if (!res.ok) throw new Error("Overpass error: " + res.status);

const data = await res.json();
const els = data.elements || [];

universitiesCache = els.map((e) => {
const lat = e.lat ?? (e.center && e.center.lat);
const lon = e.lon ?? (e.center && e.center.lon);
if (typeof lat !== "number" || typeof lon !== "number") return null;

const tags = e.tags || {};
const name = tags.name || tags["name:en"] || "University";
const website = tags.website || tags.url || tags["contact:website"] || "";
return { name, website, lat, lon };
}).filter(Boolean);

renderMapMarkers(universitiesCache);
// 初期は大学一覧は表示しない（クリックしたら出る）
} catch (e) {
console.error(e);
}
}

function renderMapMarkers(list) {
if (!markersLayer) return;
markersLayer.clearLayers();

list.forEach((u) => {
const marker = L.circleMarker([u.lat, u.lon], {
radius: 6,
weight: 2,
fillOpacity: 0.7,
});

marker.bindPopup(`
<strong>${escapeHtml(u.name)}</strong>
${u.website ? `<div style="margin-top:6px;"><a href="${escapeHtml(u.website)}" target="_blank" rel="noopener">公式サイト</a></div>` : ""}
<div style="margin-top:10px;">
<button type="button" data-map-search="${escapeHtml(u.name)}" style="
padding:10px 12px;border-radius:12px;border:1px solid rgba(29,78,216,.22);
background:#f3f6ff;font-weight:900;color:#173a8f;cursor:pointer;width:100%;
">この大学で検索</button>
</div>
`);

marker.on("popupopen", () => {
// popup内ボタンを拾う
setTimeout(() => {
const btn = document.querySelector(`[data-map-search="${CSS.escape(u.name)}"]`);
if (btn) {
btn.addEventListener("click", () => {
keywordInput.value = u.name;
// 検索実行 → 結果へ
applyFilter();
// 大学一覧も出す（その大学だけを表示）
renderUniversityList([u]);
});
}
}, 0);
});

marker.addTo(markersLayer);
});
}

function renderUniversityList(list) {
if (!universityListEl) return;
universityListEl.classList.add("open");

// clear button (map area) only shown when list is visible
let mapClearBtn = document.getElementById("mapClearBtn");
if (!mapClearBtn) {
mapClearBtn = document.createElement("button");
mapClearBtn.id = "mapClearBtn";
mapClearBtn.textContent = "検索条件をクリア";
mapClearBtn.type = "button";
mapClearBtn.addEventListener("click", () => {
universityListEl.classList.remove("open");
universityListEl.innerHTML = "";
clearFilter();
});
universityListEl.parentNode.insertBefore(mapClearBtn, universityListEl);
}
mapClearBtn.classList.add("show");

const panel = document.createElement("div");
panel.className = "uni-panel";
panel.innerHTML = `
<h3>大学一覧</h3>
<div id="uniItems"></div>
<div class="uni-actions">
<button type="button" id="closeUniList">閉じる</button>
</div>
`;

universityListEl.innerHTML = "";
universityListEl.appendChild(panel);

const uniItems = panel.querySelector("#uniItems");
list.forEach((u) => {
const row = document.createElement("div");
row.className = "uni-item";

row.innerHTML = `
<div class="uni-name">${escapeHtml(u.name)}</div>
<button type="button" class="uni-btn">この大学で検索</button>
`;

row.querySelector(".uni-btn").addEventListener("click", () => {
keywordInput.value = u.name;
applyFilter();
});

uniItems.appendChild(row);
});

panel.querySelector("#closeUniList").addEventListener("click", () => {
universityListEl.classList.remove("open");
universityListEl.innerHTML = "";
mapClearBtn.classList.remove("show");
});

// 表示されたらそこへスクロール（スマホ向け）
universityListEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

// =========================
// Bind search buttons
// =========================
function bindSearchButtons() {
if (searchBtn) searchBtn.addEventListener("click", applyFilter);
if (clearBtn) clearBtn.addEventListener("click", () => {
clearFilter();
// 地図側一覧も閉じる
if (universityListEl) {
universityListEl.classList.remove("open");
universityListEl.innerHTML = "";
}
const mapClearBtn = document.getElementById("mapClearBtn");
if (mapClearBtn) mapClearBtn.classList.remove("show");
});

// Enter key triggers search
if (keywordInput) {
keywordInput.addEventListener("keydown", (e) => {
if (e.key === "Enter") {
e.preventDefault();
applyFilter();
}
});
}
}

// =========================
// Boot
// =========================
(async function boot() {
try {
// load
[STUDENTS, CONFIG] = await Promise.all([
loadJson("students.json"),
loadJson("config.json")
]);

buildFilters(STUDENTS);
buildSuggestPool(STUDENTS);
bindSuggest();

// initial render students
renderStudents(STUDENTS);

renderContact(CONFIG);
bindRecruitForm();
bindSearchButtons();

// map
initMap();

} catch (e) {
console.error(e);
// fallback render minimal
renderNoResults();
}
})();
});
