document.addEventListener("DOMContentLoaded", () => {
  const keywordInput = document.getElementById("keyword");
  const regionFilter = document.getElementById("regionFilter");
  const courseFilter = document.getElementById("courseFilter");
  const studentListEl = document.getElementById("studentList");

  let studentsData = [];

  function escapeHtml(s = "") {
    return s
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function renderStudents(list) {
    studentListEl.innerHTML = list.map((s) => {
      const disabled = !s.enabled;
      const tags = s.tags.map(t => `<span class="hash">${escapeHtml(t)}</span>`).join("");

      const button = disabled
        ? `<a class="btn disabled" href="#" aria-disabled="true">空き枠を見る（準備中）</a>`
        : `<a class="btn" href="${escapeHtml(s.bookingUrl)}" target="_blank">空き枠を見る（8,000円 / 60分）</a>`;

      return `
        <article class="student-card ${disabled ? "is-disabled" : ""}"
          data-region="${escapeHtml(s.region)}"
          data-course="${escapeHtml(s.course)}">

          <div class="profile-image profile-circle">
            <img src="${escapeHtml(s.avatar)}" alt="${escapeHtml(s.name)}" />
          </div>

          <div class="info">
            <h3 class="student-name">${escapeHtml(s.name)}</h3>

            <div class="profile-meta">
              <div class="meta-row"><span class="meta-k">大学：</span><span class="meta-v">${escapeHtml(s.university)}</span></div>
              <div class="meta-row"><span class="meta-k">地域：</span><span class="meta-v">${escapeHtml(s.region)}</span></div>
              <div class="meta-row"><span class="meta-k">専攻：</span><span class="meta-v">${escapeHtml(s.major)}</span></div>
              <div class="meta-row"><span class="meta-k">語学力：</span><span class="meta-v">${escapeHtml(s.language)}</span></div>
              <div class="meta-row"><span class="meta-k">面談：</span><span class="meta-v">${escapeHtml(s.meeting)}</span></div>
            </div>

            <p class="bio">${escapeHtml(s.bio)}</p>
            <div class="tagline">${tags}</div>

            <div class="card-actions">
              ${button}
              <button class="btn ghost" data-copy-template>質問例をコピー</button>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  function filterStudents() {
    const keyword = keywordInput.value.toLowerCase();
    const region = regionFilter.value;
    const course = courseFilter.value;

    const filtered = studentsData.filter(s => {
      const text = JSON.stringify(s).toLowerCase();
      return (!keyword || text.includes(keyword)) &&
             (!region || s.region === region) &&
             (!course || s.course === course);
    });

    renderStudents(filtered);
  }

  keywordInput.addEventListener("input", filterStudents);
  regionFilter.addEventListener("change", filterStudents);
  courseFilter.addEventListener("change", filterStudents);

  // JSON 読み込み
  fetch("./students.json", { cache: "no-store" })
    .then(res => res.json())
    .then(data => {
      studentsData = data;
      renderStudents(studentsData);
    })
    .catch(err => {
      console.error("students.json 読み込み失敗", err);
      studentListEl.innerHTML = "<p>学生データの読み込みに失敗しました。</p>";
    });
});
