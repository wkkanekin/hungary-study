(() => {
  "use strict";

  const DATA_URL = "guides.json";

  const CATEGORY_ORDER = [
    "費用",
    "奨学金",
    "大学",
    "出願準備",
    "生活情報",
    "体験談",
    "コラム"
  ];

  const state = {
    articles: [],
    currentCategory: "すべて"
  };

  const els = {
    featuredGrid: document.getElementById("featuredGrid"),
    featuredEmpty: document.getElementById("featuredEmpty"),
    categoryRow: document.getElementById("categoryRow"),
    newGrid: document.getElementById("newGrid"),
    newEmpty: document.getElementById("newEmpty"),
    allGrid: document.getElementById("allGrid"),
    allEmpty: document.getElementById("allEmpty"),
    currentCategoryLabel: document.getElementById("currentCategoryLabel")
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function isValidDateString(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
  }

  function sortByDateDesc(items) {
    return [...items].sort((a, b) => {
      const da = isValidDateString(a.date) ? new Date(a.date).getTime() : 0;
      const db = isValidDateString(b.date) ? new Date(b.date).getTime() : 0;
      return db - da;
    });
  }

  function normalizeArticle(raw) {
    return {
      id: String(raw.id || "").trim(),
      enabled: raw.enabled === true,
      featured: raw.featured === true,
      comingSoon: raw.comingSoon === true,
      title: String(raw.title || "").trim(),
      description: String(raw.description || "").trim(),
      category: String(raw.category || "").trim(),
      url: String(raw.url || "").trim(),
      date: String(raw.date || "").trim()
    };
  }

  function articleIsUsable(article) {
    return (
      article.enabled === true &&
      article.id &&
      article.title &&
      article.description &&
      article.category &&
      article.url
    );
  }

  function createFeaturedCard(article) {
    return `
      <article class="featuredCard card">
        <div class="featuredBody">
          <span class="chip">${escapeHtml(article.category)}</span>
          <h3 class="featuredTitle">
            <a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a>
          </h3>
          <p class="featuredDesc">${escapeHtml(article.description)}</p>
          <div class="cardMeta">
            <span>公開日：${escapeHtml(article.date || "未設定")}</span>
          </div>
          <div class="cardActions">
            <a class="btn primary" href="${escapeHtml(article.url)}">記事を読む</a>
          </div>
        </div>
      </article>
    `;
  }

  function createArticleCard(article) {
    return `
      <article class="articleCard card">
        <div class="articleBody">
          <span class="chip">${escapeHtml(article.category)}</span>
          <h3 class="articleTitle">
            <a href="${escapeHtml(article.url)}">${escapeHtml(article.title)}</a>
          </h3>
          <p class="articleDesc">${escapeHtml(article.description)}</p>
          <div class="cardMeta">
            <span>公開日：${escapeHtml(article.date || "未設定")}</span>
          </div>
          <div class="cardActions">
            <a class="btn" href="${escapeHtml(article.url)}">記事を読む</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderFeatured() {
    if (!els.featuredGrid || !els.featuredEmpty) return;

    const featuredArticles = sortByDateDesc(
      state.articles.filter((article) => article.enabled === true && article.featured === true)
    ).slice(0, 2);

    if (featuredArticles.length === 0) {
      els.featuredGrid.innerHTML = "";
      els.featuredEmpty.classList.remove("isHidden");
      return;
    }

    els.featuredGrid.innerHTML = featuredArticles.map(createFeaturedCard).join("");
    els.featuredEmpty.classList.add("isHidden");
  }

  function collectCategories() {
    const dataCategories = Array.from(
      new Set(
        state.articles
          .filter((article) => article.enabled === true)
          .map((article) => article.category)
      )
    );

    const sortedKnown = CATEGORY_ORDER.filter((cat) => dataCategories.includes(cat));
    const sortedUnknown = dataCategories
      .filter((cat) => !CATEGORY_ORDER.includes(cat))
      .sort((a, b) => a.localeCompare(b, "ja"));

    return ["すべて", ...sortedKnown, ...sortedUnknown];
  }

  function renderCategories() {
    if (!els.categoryRow) return;

    const categories = collectCategories();

    els.categoryRow.innerHTML = categories.map((category) => {
      const activeClass = category === state.currentCategory ? " active" : "";
      const categoryAttr = escapeHtml(category);

      return `
        <button type="button" class="categoryChip${activeClass}" data-category="${categoryAttr}">
          ${categoryAttr}
        </button>
      `;
    }).join("");

    els.categoryRow.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextCategory = button.getAttribute("data-category") || "すべて";
        state.currentCategory = nextCategory;
        renderCategories();
        renderAllArticles();
      });
    });
  }

  function renderNewArticles() {
    if (!els.newGrid || !els.newEmpty) return;

    const newest = sortByDateDesc(
      state.articles.filter((article) => article.enabled === true)
    ).slice(0, 3);

    if (newest.length === 0) {
      els.newGrid.innerHTML = "";
      els.newEmpty.classList.remove("isHidden");
      return;
    }

    els.newGrid.innerHTML = newest.map(createArticleCard).join("");
    els.newEmpty.classList.add("isHidden");
  }

  function getFilteredArticles() {
    const enabledArticles = state.articles.filter((article) => article.enabled === true);

    if (state.currentCategory === "すべて") {
      return sortByDateDesc(enabledArticles);
    }

    return sortByDateDesc(
      enabledArticles.filter((article) => article.category === state.currentCategory)
    );
  }

  function renderAllArticles() {
    if (!els.allGrid || !els.allEmpty) return;

    const filtered = getFilteredArticles();

    if (els.currentCategoryLabel) {
      els.currentCategoryLabel.textContent = `表示中：${state.currentCategory}`;
    }

    if (filtered.length === 0) {
      els.allGrid.innerHTML = "";
      els.allEmpty.classList.remove("isHidden");
      return;
    }

    els.allGrid.innerHTML = filtered.map(createArticleCard).join("");
    els.allEmpty.classList.add("isHidden");
  }

  async function loadArticles() {
    const response = await fetch(DATA_URL, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`guides.json の読み込みに失敗しました: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("guides.json の形式が正しくありません。配列である必要があります。");
    }

    state.articles = data
      .map(normalizeArticle)
      .filter(articleIsUsable);
  }

  function renderError(message) {
    const errorHtml = `
      <div class="emptyBox card">
        <p>${escapeHtml(message)}</p>
      </div>
    `;

    if (els.featuredGrid) els.featuredGrid.innerHTML = errorHtml;
    if (els.newGrid) els.newGrid.innerHTML = errorHtml;
    if (els.allGrid) els.allGrid.innerHTML = errorHtml;
    if (els.categoryRow) els.categoryRow.innerHTML = "";

    if (els.featuredEmpty) els.featuredEmpty.classList.add("isHidden");
    if (els.newEmpty) els.newEmpty.classList.add("isHidden");
    if (els.allEmpty) els.allEmpty.classList.add("isHidden");

    if (els.currentCategoryLabel) {
      els.currentCategoryLabel.textContent = "表示中：読み込み失敗";
    }
  }

  async function init() {
    try {
      await loadArticles();
      renderFeatured();
      renderCategories();
      renderNewArticles();
      renderAllArticles();
    } catch (error) {
      console.error(error);
      renderError("Guide記事データの読み込みに失敗しました。guides.json を確認してください。");
    }
  }

  init();
})();