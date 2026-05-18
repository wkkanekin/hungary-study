(() => {
  "use strict";

  const UNIVERSITY_ID = String(window.UNIVERSITY_PAGE_ID || "").trim();
  const UNIVERSITY_NAME_MATCH = String(window.UNIVERSITY_NAME_MATCH || "").trim();

  const URLS = {
    rankings: "rankings.json",
    students: "Students4.txt",
    tuition: "university-fees.json"
  };

  const els = {
    rankingChip: document.getElementById("rankingChip"),
    studentCountChip: document.getElementById("studentCountChip"),
    summaryRanking: document.getElementById("summaryRanking"),
    summaryTuition: document.getElementById("summaryTuition"),
    summaryStudents: document.getElementById("summaryStudents"),
    tuitionTable: document.getElementById("tuitionTable"),
    studentGrid: document.getElementById("studentGrid")
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function normalizeText(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");
  }

  function formatMoney(value, currency) {
    const raw = String(value ?? "").trim();
    const cur = String(currency ?? "").trim();

    if (!raw) return "要確認";

    if (cur) {
      return `${raw} ${cur}`;
    }

    return raw;
  }

  function setText(el, text) {
    if (el) el.textContent = text;
  }

  async function fetchJson(url) {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`${url} の読み込みに失敗しました: ${response.status}`);
    }

    return await response.json();
  }

  async function loadRankings() {
    try {
      const data = await fetchJson(URLS.rankings);
      const rows = Array.isArray(data?.universities) ? data.universities : [];

      const targetName = normalizeText(UNIVERSITY_NAME_MATCH);

      const row = rows.find((item) => {
        return normalizeText(item?.university) === targetName;
      });

      const rank = row?.rank ? String(row.rank) : "—";

      setText(els.rankingChip, rank);
      setText(els.summaryRanking, rank);
    } catch (error) {
      console.error(error);
      setText(els.rankingChip, "取得失敗");
      setText(els.summaryRanking, "取得失敗");
    }
  }

  async function loadTuition() {
    try {
      const data = await fetchJson(URLS.tuition);
      const universities = Array.isArray(data?.universities) ? data.universities : [];

      const target = universities.find((item) => {
        return String(item?.id || "").trim() === UNIVERSITY_ID;
      });

      const fees = Array.isArray(target?.fees) ? target.fees : [];

      if (!fees.length) {
        if (els.tuitionTable) {
          els.tuitionTable.innerHTML = `
            <tr>
              <td colspan="4">学費データは準備中です。公式サイトで確認してください。</td>
            </tr>
          `;
        }

        setText(els.summaryTuition, "要確認");
        return;
      }

      const minFee = target?.summary_fee || "";
      setText(els.summaryTuition, minFee ? String(minFee) : "要確認");

      if (els.tuitionTable) {
        els.tuitionTable.innerHTML = fees.map((fee) => {
          const program = escapeHtml(fee.program || "—");
          const degree = escapeHtml(fee.degree || "—");
          const amount = escapeHtml(formatMoney(fee.amount, fee.currency));
          const scholarship = escapeHtml(fee.scholarship || "要確認");

          return `
            <tr>
              <td>${program}</td>
              <td>${degree}</td>
              <td>${amount}</td>
              <td>${scholarship}</td>
            </tr>
          `;
        }).join("");
      }
    } catch (error) {
      console.error(error);

      if (els.tuitionTable) {
        els.tuitionTable.innerHTML = `
          <tr>
            <td colspan="4">学費データの読み込みに失敗しました。公式サイトで確認してください。</td>
          </tr>
        `;
      }

      setText(els.summaryTuition, "取得失敗");
    }
  }

  async function loadStudents() {
    try {
      const data = await fetchJson(URLS.students);
      const students = Array.isArray(data) ? data : [];

      const targetName = normalizeText(UNIVERSITY_NAME_MATCH);

      const matched = students.filter((student) => {
        if (!student?.enabled) return false;
        return normalizeText(student?.university) === targetName;
      });

      const countText = matched.length ? `${matched.length}名` : "準備中";
      setText(els.studentCountChip, countText);
      setText(els.summaryStudents, countText);

      renderStudents(matched);
    } catch (error) {
      console.error(error);

      setText(els.studentCountChip, "取得失敗");
      setText(els.summaryStudents, "取得失敗");

      if (els.studentGrid) {
        els.studentGrid.innerHTML = `
          <div class="emptyBox">現役生データの読み込みに失敗しました。</div>
        `;
      }
    }
  }

  function renderStudents(students) {
    if (!els.studentGrid) return;

    if (!students.length) {
      els.studentGrid.innerHTML = `
        <div class="emptyBox">
          この大学の現役生は現在準備中です。
        </div>
      `;
      return;
    }

    els.studentGrid.innerHTML = students.map((student) => {
      const name = escapeHtml(student.name || "名前未設定");
      const major = escapeHtml(student.major || "専攻未設定");
      const year = escapeHtml(student.year || "学年未設定");
      const avatar = escapeHtml(student.avatar || "images/students/default.jpg");
      const bookingUrl = escapeHtml(student.bookingUrl || "");
      const profileUrl = `index.html#students`;

      const bookingButton = bookingUrl
        ? `<a class="btn primary small" href="${bookingUrl}" target="_blank" rel="noopener">相談する</a>`
        : `<a class="btn primary small" href="index.html#contact">問い合わせる</a>`;

      return `
        <article class="studentCard">
          <img class="studentAvatar" src="${avatar}" alt="${name}">
          <div>
            <h3 class="studentName">${name}</h3>
            <div class="studentMeta">${major}</div>
            <div class="studentMeta">${year}</div>
            <div class="studentActions">
              ${bookingButton}
              <a class="btn small" href="${profileUrl}">現役生一覧を見る</a>
            </div>
          </div>
        </article>
      `;
    }).join("");
  }

  async function init() {
    await Promise.allSettled([
      loadRankings(),
      loadTuition(),
      loadStudents()
    ]);
  }

  init();
})();