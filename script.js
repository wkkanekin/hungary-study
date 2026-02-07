document.addEventListener("DOMContentLoaded", () => {

 /* =========================
 設定
 ========================= */
 const STUDENTS_URL = "students.json";
 const CONFIG_URL = "config.json";

 /* =========================
 共通DOM
 ========================= */
 const studentList = document.getElementById("studentList");
 const keywordInput = document.getElementById("keyword");
 const regionSelect = document.getElementById("regionFilter");
 const courseSelect = document.getElementById("courseFilter");
 const searchBtn = document.getElementById("applySearch");
 const clearBtn = document.getElementById("clearSearch");

 const recruitBtn = document.getElementById("openRecruitForm");
 const recruitAccordion = document.getElementById("recruitAccordion");

 const contactMail = document.getElementById("contactMail");

 /* =========================
 データ
 ========================= */
 let students = [];
 let config = {};

 /* =========================
 ユーティリティ
 ========================= */
 function escapeHTML(str = "") {
 return str
 .replace(/&/g, "&amp;")
 .replace(/</g, "&lt;")
 .replace(/>/g, "&gt;")
 .replace(/"/g, "&quot;");
 }

 function scrollToEl(el) {
 if (!el) return;
 el.scrollIntoView({ behavior: "smooth", block: "start" });
 }

 /* =========================
 現役生描画
 ========================= */
 function renderStudents(list) {
 studentList.innerHTML = "";

 if (!list.length) {
 studentList.innerHTML = `
 <div class="studentCard">
 該当する現役生がいません。
 </div>
 `;
 return;
 }

 list.forEach(stu => {
 const stipend = stu.stipendium?.has
 ? `<div class="badge">奨学金：${escapeHTML(stu.stipendium.name)}</div>`
 : "";

 const card = document.createElement("div");
 card.className = "studentCard";

 card.innerHTML = `
 <img src="${escapeHTML(stu.avatar)}" alt="${escapeHTML(stu.name)}">
 <h3>${escapeHTML(stu.name)}</h3>
 ${stipend}
 <p class="muted">${escapeHTML(stu.bio)}</p>
 <a class="btn" href="${escapeHTML(stu.bookingUrl)}" target="_blank">
 空き枠を見る
 </a>
 `;

 studentList.appendChild(card);
 });
 }

 /* =========================
 検索
 ========================= */
 function applySearch() {
 const kw = keywordInput.value.trim().toLowerCase();
 const region = regionSelect.value;
 const course = courseSelect.value;

 const filtered = students.filter(stu => {
 if (!stu.enabled) return false;

 let ok = true;

 if (kw) {
 const text = [
 stu.name,
 stu.university,
 stu.major,
 stu.region,
 stu.course,
 ...(stu.tags || [])
 ].join(" ").toLowerCase();
 ok = ok && text.includes(kw);
 }

 if (region) ok = ok && stu.region === region;
 if (course) ok = ok && stu.course === course;

 return ok;
 });

 renderStudents(filtered);
 scrollToEl(studentList);
 }

 function clearSearch() {
 keywordInput.value = "";
 regionSelect.value = "";
 courseSelect.value = "";
 studentList.innerHTML = "";
 }

 /* =========================
 今月の注目現役生
 ========================= */
 function renderFeatured() {
 const featured = students
 .filter(s => s.enabled && s.featured)
 .slice(0, 2);

 renderStudents(featured);
 }

 /* =========================
 現役生募集フォーム（アコーディオン）
 ========================= */
 if (recruitBtn && recruitAccordion) {
 recruitBtn.addEventListener("click", () => {
 const isOpen = recruitAccordion.style.display === "block";
 recruitAccordion.style.display = isOpen ? "none" : "block";
 if (!isOpen) scrollToEl(recruitAccordion);
 });
 }

 /* =========================
 フォーム送信（mailto）
 ========================= */
 document.addEventListener("submit", e => {
 if (e.target.id !== "recruitForm") return;

 e.preventDefault();

 const f = e.target;
 const body = `
名前：${f.name.value}
大学名：${f.university.value}
学年・課程：${f.grade.value}
メール：${f.email.value}

質問・補足：
${f.note.value}
 `;

 const mail = config.email || "";
 location.href = `mailto:${mail}?subject=現役生参加申し込み&body=${encodeURIComponent(body)}`;
 });

 /* =========================
 データ読み込み
 ========================= */
 Promise.all([
 fetch(STUDENTS_URL).then(r => r.json()),
 fetch(CONFIG_URL).then(r => r.json())
 ])
 .then(([stuData, cfg]) => {
 students = stuData;
 config = cfg;

 // 初期表示：今月の注目現役生
 renderFeatured();

 // メール
 if (contactMail) {
 contactMail.href = `mailto:${config.email}`;
 contactMail.textContent = config.email;
 }
 })
 .catch(err => {
 console.error(err);
 studentList.innerHTML = "データの読み込みに失敗しました。";
 });

 /* =========================
 イベント
 ========================= */
 if (searchBtn) searchBtn.addEventListener("click", applySearch);
 if (clearBtn) clearBtn.addEventListener("click", clearSearch);

});