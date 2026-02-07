document.addEventListener("DOMContentLoaded", () => {
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
    const el = typeof hashOrEl === "string" ? document.querySelector(hashOrEl) : hashOrEl;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ===== Mini TOC =====
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
    tocPanel.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeToc));
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!t) return;
      const inside = tocPanel.contains(t) || tocToggle.contains(t);
      if (!inside) closeToc();
    });
  }

  // ===== Search UI =====
  const keywordInput = $("keyword");
  const regionFilter = $("regionFilter");
  const courseFilter = $("courseFilter");
  const applySearchBtn = $("applySearch");
  const clearSearchBtn = $("clearSearch");
  const suggestBox = $("suggestBox");

  // ===== Students list =====
  const studentListEl = $("studentList");
  const noResultsEl = $("noResults");
  const studentListTitle = $("studentListTitle");

  // ===== Contact / Social =====
  const contactGrid = $("contactGrid");
  const socialGrid = $("socialGrid");

  // ===== Map =====
  const mapEl = $("huMap");
  const uniListEl = $("uniList");
  const mapHintEl = $("mapHint");
  const mapStatusEl = $("mapStatus");
  const clearUniBtn = $("clearUniFilter");
  const applyMapSearchBtn = $("applyMapSearch");
  const pickedUniEl = $("pickedUni");

  // ===== Recruit form (accordion) =====
  const recruitOpenBtn = $("recruitOpenBtn");
  const recruitFormWrap = $("recruitFormWrap");
  const recruitName = $("recruitName");
  const recruitUniversity = $("recruitUniversity");
  const recruitYear = $("recruitYear");
  const recruitEmail = $("recruitEmail");
  const recruitNote = $("recruitNote");
  const recruitSendBtn = $("recruitSendBtn");
  const recruitMsg = $("recruitMsg");
  const closeRecruitFormBtn = $("closeRecruitForm");

  // ===== Data =====
  let students = [];
  let suggestPool = [];
  let config = null;
  let pickedUniversityName = "";

  const buildSearchText = (stu) => {
    const tags = Array.isArray(stu.tags) ? stu.tags.join(" ") : "";
    const links = Array.isArray(stu.links)
      ? stu.links.map((l) => `${l?.label ?? ""} ${l?.url ?? ""}`).join(" ")
      : "";
    const stip = stu?.stipendium?.has ? stu?.stipendium?.name || "stipendium" : "";
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

  const getAgeLabel = (stu) => {
    const v =
      stu?.ageDecade ||
      stu?.ageGroup ||
      stu?.decade ||
      stu?.age_label ||
      stu?.ageLabel ||
      "";
    if (v) return String(v);
    const n = Number(stu?.age);
    if (Number.isFinite(n) && n > 0) return `${Math.floor(n / 10) * 10}代`;
    return "";
  };

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
            `<a class="linkPill" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(
              l.label
            )}</a>`
        )
        .join("");

      const stipendiumBadge = stu?.stipendium?.has
        ? `<span class="badgeMini">奨学金：${esc(stu?.stipendium?.name || "取得")}</span>`
        : "";

      const bookingBtn = disabled
        ? `<a class="btn" href="#" aria-disabled="true" onclick="return false;">空き枠を見る（準備中）</a>`
        : `<a class="btn primary" href="${esc(
            stu.bookingUrl || "#"
          )}" target="_blank" rel="noopener">空き枠を見る（6,000円 / 40分）</a>`;

      const avatarUrl = stu.avatar || "https://placehold.co/520x520/png?text=Avatar";
      const ageLabel = getAgeLabel(stu);

      const card = document.createElement("article");
      card.className = `studentCard${disabled ? " disabled" : ""}`;

      card.innerHTML = `
        <div class="studentTop">
          <div class="avatar">
            <img src="${esc(avatarUrl)}" alt="${esc(stu.name)} のアバター" loading="lazy" />
          </div>
          <div class="studentHead">
            <p class="studentName">${esc(stu.name)}</p>
            <div class="studentMini">
              ${ageLabel ? `<span class="pill">${esc(ageLabel)}</span>` : ""}
              ${stipendiumBadge || ""}
            </div>
          </div>
        </div>

        <div class="metaBox">
          <div class="metaRow"><span class="metaK">大学</span><span class="metaV">${esc(
            stu.university || ""
          )}</span></div>
          <div class="metaRow"><span class="metaK">地域</span><span class="metaV">${esc(
            stu.region || ""
          )}</span></div>
          <div class="metaRow"><span class="metaK">専攻</span><span class="metaV">${esc(
            stu.major || ""
          )}</span></div>
          <div class="metaRow"><span class="metaK">学年</span><span class="metaV">${esc(
            stu.year || ""
          )}</span></div>
          <div class="metaRow"><span class="metaK">語学</span><span class="metaV">${esc(
            stu.language || ""
          )}</span></div>
          <div class="metaRow"><span class="metaK">面談</span><span class="metaV">${esc(
            stu.meeting || ""
          )}</span></div>
        </div>

        ${stu.bio ? `<p class="bio">${esc(stu.bio)}</p>` : ""}
        ${tagsHtml ? `<div class="tags">${tagsHtml}</div>` : ""}
        ${linksHtml ? `<div class="linkList">${linksHtml}</div>` : ""}

        ${bookingBtn}
      `;

      studentListEl.appendChild(card);
    });
  };

  const renderFeatured = () => {
    if (studentListTitle) studentListTitle.textContent = "今月の注目現役生（最大2名）";
    if (noResultsEl) noResultsEl.style.display = "none";

    const enabled = students.filter((s) => isEnabled(s));
    const picks = enabled.filter((s) => s.featured === true || s.pick === true).slice(0, 2);
    const list = (picks.length ? picks : enabled.slice(0, 2));
    renderStudents(list);
  };

  const applyFilterAndJump = () => {
    if (studentListTitle) studentListTitle.textContent = "検索結果";

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
    ["奨学金","Stipendium","スティペンディウム","出願","生活費","住まい","治安"].forEach((w)=>set.add(w));
    return Array.from(set);
  };

  const renderSuggest = (query) => {
    if (!suggestBox) return;
    const q = norm(query);
    if (!q) return closeSuggest();

    const hits = suggestPool
      .map((s) => ({ raw: s, n: norm(s) }))
      .filter((x) => x.n.includes(q))
      .slice(0, 8);

    if (!hits.length) return closeSuggest();

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

    suggestBox.classList.add("open");
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

  if (applySearchBtn) applySearchBtn.addEventListener("click", applyFilterAndJump);
  if (clearSearchBtn) clearSearchBtn.addEventListener("click", () => {
    if (keywordInput) keywordInput.value = "";
    if (regionFilter) regionFilter.value = "";
    if (courseFilter) courseFilter.value = "";
    closeSuggest();
    renderFeatured();
    smoothScrollTo("#students");
  });

  // ===== config render =====
  const iconSvg = (name) => {
    const n = norm(name);
    if (n.includes("youtube")) return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M21.6 7.2c-.2-1.1-.9-2-2-2.2C17.8 4.6 12 4.6 12 4.6s-5.8 0-7.6.4c-1.1.2-1.8 1.1-2 2.2C2 9 2 12 2 12s0 3 .4 4.8c.2 1.1.9 2 2 2.2 1.8.4 7.6.4 7.6.4s5.8 0 7.6-.4c1.1-.2 1.8-1.1 2-2.2.4-1.8.4-4.8.4-4.8s0-3-.4-4.8z"></path><path d="M10 15.5v-7l6 3.5-6 3.5z" fill="white"></path></svg>`;
    if (n.includes("instagram")) return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm10 2H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3z"></path><path d="M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"></path><path d="M17.5 6.5a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"></path></svg>`;
    if (n === "x" || n.includes("twitter")) return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M18.9 2H22l-6.8 7.8L23 22h-6.3l-4.9-6.5L6.2 22H3l7.3-8.4L1 2h6.4l4.4 5.9L18.9 2zm-1.1 18h1.7L7.1 3.9H5.3L17.8 20z"></path></svg>`;
    if (n.includes("note")) return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M6 4h12v16H6V4zm2 2v12h8V6H8z"></path></svg>`;
    if (n.includes("facebook")) return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M13 22v-8h3l1-4h-4V7.5c0-1.2.4-2 2-2H17V2.2C16.5 2.1 15.3 2 14 2c-2.8 0-5 1.7-5 5v3H6v4h3v8h4z"></path></svg>`;
    // email / default
    return `<svg viewBox="0 0 24 24" width="22" height="22"><path d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z"></path></svg>`;
  };

  const loadConfig = async () => {
    const res = await fetch("config.json", { cache: "no-store" });
    if (!res.ok) throw new Error("config.json が読み込めません: " + res.status);
    config = await res.json();

    // Email only
    if (contactGrid) {
      contactGrid.innerHTML = "";
      const email = config?.email || "";
      const a = document.createElement("a");
      a.className = "contactItem";
      a.href = email ? `mailto:${encodeURIComponent(email)}` : "#";
      a.innerHTML = `
        <div class="contactIcon">${iconSvg("email")}</div>
        <div>
          <div class="contactK">メール</div>
          <div class="contactV">${esc(email || "未設定")}</div>
        </div>
      `;
      contactGrid.appendChild(a);
    }

    // Socials
    if (socialGrid) {
      socialGrid.innerHTML = "";
      const socials = Array.isArray(config?.socials) ? config.socials : [];
      socials.forEach((s) => {
        const a = document.createElement("a");
        a.className = "contactItem";
        a.href = s?.url || "#";
        a.target = "_blank";
        a.rel = "noopener";
        a.innerHTML = `
          <div class="contactIcon">${iconSvg(s?.label || "sns")}</div>
          <div>
            <div class="contactK">${esc(s?.label || "SNS")}</div>
            <div class="contactV">${esc(s?.url || "")}</div>
          </div>
        `;
        socialGrid.appendChild(a);
      });
    }
  };

  const loadStudents = async () => {
    const res = await fetch("students.json", { cache: "no-store" });
    if (!res.ok) throw new Error("students.json が読み込めません: " + res.status);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error("students.json は配列にしてください");
    students = data;
    suggestPool = buildSuggestPool(students);
    renderFeatured();
  };

  // ===== Recruit accordion =====
  const setRecruitMsg = (t) => recruitMsg && (recruitMsg.textContent = t || "");

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
      openRecruitForm();
    });
  }

  if (closeRecruitFormBtn) {
    closeRecruitFormBtn.addEventListener("click", (e) => {
      e.preventDefault();
      closeRecruitForm();
    });
  }

  if (recruitSendBtn) {
    recruitSendBtn.addEventListener("click", (e) => {
      e.preventDefault();

      const to = config?.email || "";
      if (!to) return setRecruitMsg("送信先メール（config.json の email）が未設定です。");

      const name = (recruitName?.value || "").trim();
      const uni = (recruitUniversity?.value || "").trim();
      const year = (recruitYear?.value || "").trim();
      const email = (recruitEmail?.value || "").trim();
      const note = (recruitNote?.value || "").trim();

      if (!name || !uni || !year || !email) {
        return setRecruitMsg("必須項目（名前・大学・学年・メール）を入力してください。");
      }

      setRecruitMsg("");

      const subject = "【現役生参加希望】申し込みフォーム";
      const body = [
        "現役生として参加希望です。",
        "",
        "【入力内容】",
        `・名前（表示名）：${name}`,
        `・大学名：${uni}`,
        `・学年・課程：${year}`,
        `・メールアドレス：${email}`,
        `・自由記述：${note || "（なし）"}`,
        "",
        "※ まずは簡単な情報だけで大丈夫です。内容を確認後、こちらから詳しくご連絡いたします。"
      ].join("\n");

      const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }

  // ===== Boot =====
  (async () => {
    try {
      await Promise.all([loadStudents(), loadConfig()]);
    } catch (e) {
      console.error(e);
      // 失敗時の最低限表示
      if (contactGrid) contactGrid.innerHTML = `<div class="muted">config.json 読み込み失敗</div>`;
      if (socialGrid) socialGrid.innerHTML = "";
    }
  })();
});
