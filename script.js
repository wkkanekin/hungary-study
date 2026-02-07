document.addEventListener("DOMContentLoaded", async () => {
  // =========================
  // Helpers
  // =========================
  const $ = (id) => document.getElementById(id);

  const esc = (str) =>
    String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const norm = (str) => String(str ?? "").trim().toLowerCase();

  // =========================
  // Elements (既存HTMLの文言は触らない)
  // =========================
  const keywordInput = $("keyword");
  const regionFilter = $("regionFilter");
  const courseFilter = $("courseFilter");
  const applySearchBtn = $("applySearch");
  const clearSearchBtn = $("clearSearch");

  const studentListEl = $("studentList");
  const noResultsEl = $("noResults");

  // =========================
  // Data
  // =========================
  let students = [];

  // 「おすすめ」判定
  // - featured: true があればそれを優先して最大2名
  // - なければ enabled !== false の先頭から2名
  const pickFeatured2 = (arr) => {
    const enabled = arr.filter((s) => s && s.enabled !== false);
    const featured = enabled.filter((s) => s.featured === true);
    if (featured.length >= 2) return featured.slice(0, 2);
    if (featured.length === 1) {
      const rest = enabled.filter((x) => x !== featured[0]);
      return [featured[0], ...rest.slice(0, 1)];
    }
    return enabled.slice(0, 2);
  };

  // 検索対象文字列（students.jsonベース）
  const buildSearchText = (stu) => {
    const tags = Array.isArray(stu.tags) ? stu.tags.join(" ") : "";
    const links = Array.isArray(stu.links)
      ? stu.links.map((l) => `${l?.label ?? ""} ${l?.url ?? ""}`).join(" ")
      : "";
    const stipendium = stu?.stipendium?.has
      ? `${stu?.stipendium?.name ?? ""} 奨学金 stipendium`
      : "";

    return norm(
      [
        stu.name,
        stu.university,
        stu.region,
        stu.course,
        stu.major,
        stu.year,
        stu.ageDecade,
        stu.language,
        stu.meeting,
        stu.bio,
        tags,
        links,
        stipendium,
      ].join(" ")
    );
  };

  // =========================
  // Rendering (JSON→カード生成)
  // ※文言は増やしすぎない。データ表示のみ。
  // =========================
  const renderStudents = (list) => {
    if (!studentListEl) return;

    studentListEl.innerHTML = "";

    if (!list || list.length === 0) {
      if (noResultsEl) noResultsEl.style.display = "block";
      return;
    }
    if (noResultsEl) noResultsEl.style.display = "none";

    list.forEach((stu) => {
      const disabled = stu.enabled === false;

      const avatarUrl =
        stu.avatar && String(stu.avatar).trim()
          ? String(stu.avatar).trim()
          : "https://placehold.co/520x520/png?text=Avatar";

      const ageLabel = String(stu.ageDecade ?? "").trim();
      const stipendiumMini = stu?.stipendium?.has ? (stu?.stipendium?.name || "奨学金あり") : "";

      // 上部は「名前 / 年代 / 奨学金」のみ（要件）
      const topMetaParts = [];
      if (ageLabel) topMetaParts.push(ageLabel);
      if (stu?.stipendium?.has) topMetaParts.push("奨学金あり");
      const topMeta = topMetaParts.join(" / ");

      // 詳細カード（必要情報はここに）
      const detailRows = [
        ["大学", stu.university],
        ["地域", stu.region],
        ["分野", stu.course],
        ["専攻", stu.major],
        ["学年", stu.year],
        ["語学", stu.language],
        ["面談", stu.meeting],
      ]
        .filter(([, v]) => String(v ?? "").trim() !== "")
        .map(
          ([k, v]) => `
          <div class="metaRow">
            <span class="metaK">${esc(k)}</span>
            <span class="metaV">${esc(v)}</span>
          </div>
        `
        )
        .join("");

      const tagsHtml = (Array.isArray(stu.tags) ? stu.tags : [])
        .filter((t) => String(t ?? "").trim() !== "")
        .map((t) => `<span class="tag">${esc(t)}</span>`)
        .join("");

      const linksHtml = (Array.isArray(stu.links) ? stu.links : [])
        .filter((l) => l && l.label && l.url)
        .map(
          (l) =>
            `<a class="linkPill" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(
              l.label
            )}</a>`
        )
        .join("");

      const bookingBtn = disabled
        ? `<a class="btn" href="#" aria-disabled="true" onclick="return false;">空き枠を見る（準備中）</a>`
        : `<a class="btn primary" href="${esc(stu.bookingUrl || "#")}" target="_blank" rel="noopener">空き枠を見る（6,000円 / 40分）</a>`;

      const card = document.createElement("article");
      card.className = `studentCard${disabled ? " disabled" : ""}`;

      card.innerHTML = `
        <div class="studentTop">
          <div class="avatar" aria-label="アバター">
            <img src="${esc(avatarUrl)}" alt="${esc(stu.name)}" loading="lazy" />
          </div>
          <div>
            <p class="studentName">${esc(stu.name || "")}</p>
            ${topMeta ? `<p class="studentMeta">${esc(topMeta)}</p>` : ``}
            ${
              stipendiumMini
                ? `<div style="margin-top:6px"><span class="badgeMini">奨学金：${esc(
                    stipendiumMini
                  )}</span></div>`
                : ``
            }
          </div>
        </div>

        ${
          detailRows
            ? `<div class="metaBox" aria-label="詳細情報">${detailRows}</div>`
            : ``
        }

        ${stu.bio ? `<p class="bio">${esc(stu.bio)}</p>` : ``}

        ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ``}

        ${linksHtml ? `<div class="linkList" aria-label="外部リンク">${linksHtml}</div>` : ``}

        ${bookingBtn}
      `;

      studentListEl.appendChild(card);
    });
  };

  // =========================
  // Search logic (students.jsonベース)
  // =========================
  const applySearch = () => {
    const kw = norm(keywordInput?.value || "");
    const region = String(regionFilter?.value || "").trim();
    const course = String(courseFilter?.value || "").trim();

    const result = students.filter((stu) => {
      if (!stu) return false;

      const text = buildSearchText(stu);

      const okKw = !kw || text.includes(kw);

      // selectは「完全一致」でOK（地域/分野）
      const okRegion = !region || String(stu.region || "") === region;
      const okCourse = !course || String(stu.course || "") === course;

      return okKw && okRegion && okCourse;
    });

    renderStudents(result);
  };

  const clearSearch = () => {
    if (keywordInput) keywordInput.value = "";
    if (regionFilter) regionFilter.value = "";
    if (courseFilter) courseFilter.value = "";

    // クリアしたら「おすすめ2名」に戻す（要件）
    renderStudents(pickFeatured2(students));
  };

  // =========================
  // Bind events
  // =========================
  if (applySearchBtn) applySearchBtn.addEventListener("click", applySearch);
  if (clearSearchBtn) clearSearchBtn.addEventListener("click", clearSearch);

  // Enterでも検索したい場合（任意：文言は変えない）
  if (keywordInput) {
    keywordInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") applySearch();
    });
  }

  // =========================
  // Boot: load students.json
  // =========================
  try {
    const res = await fetch("students.json", { cache: "no-store" });
    if (!res.ok) throw new Error(`students.json が読み込めません（status: ${res.status}）`);

    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("students.json は配列である必要があります。");

    students = data;

    // 初期表示：おすすめ2名を必ず表示（要件）
    renderStudents(pickFeatured2(students));
  } catch (err) {
    console.error(err);
    if (studentListEl) {
      studentListEl.innerHTML = `
        <div class="card" style="padding:16px">
          <div style="font-weight:950">読み込みに失敗しました</div>
          <div style="margin-top:6px; opacity:.8;">
            students.json のパス/ファイル名/JSON形式を確認してください。
          </div>
        </div>
      `;
    }
    if (noResultsEl) noResultsEl.style.display = "none";
  }
});
