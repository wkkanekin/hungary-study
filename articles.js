(() => {
  'use strict';
  const home = document.getElementById('homeArticleList');
  const catalogue = document.getElementById('allArticleList');
  if (!home && !catalogue) return;
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function mergeArticles(guides, columns) {
    const unique = new Map();
    // Column metadata takes precedence if a future article appears in both sources.
    for (const [items, kind] of [[guides, '留学ガイド'], [columns, '現役生コラム']]) {
      for (const item of items) {
        if (item.enabled !== true || item.comingSoon === true || !item.url || !item.title) continue;
        const url = new URL(item.url, document.baseURI);
        if (url.origin !== location.origin) continue;
        unique.set(url.pathname, {...item, kind, description: item.description || item.summary || ''});
      }
    }
    return [...unique.values()].sort((a,b) => (b.date || '').localeCompare(a.date || '') || a.url.localeCompare(b.url));
  }
  function card(item) {
    return `<a class="dailyGuideCard articleLinkCard" href="${escape(item.url)}"><img class="dailyGuideImg" src="${escape(item.thumbnail)}" alt="${escape(item.title)}" loading="lazy"><div class="dailyGuideCardTop"><span class="dailyGuideCategory">${escape(item.kind)}</span>${item.date ? `<time class="dailyGuideDate" datetime="${escape(item.date)}">${escape(item.date)}</time>` : ""}</div><h3 class="dailyGuideCardTitle">${escape(item.title)}</h3><p class="dailyGuideCardDesc">${escape(item.description.slice(0,96))}</p><span class="btn dailyGuideBtn">記事を読む</span></a>`;
  }
  function pickRandom(items, max = 3) {
    const shuffled = [...items];
    for (let i = shuffled.length-1; i > 0; i--) {
      const j = Math.floor(Math.random()*(i+1));
      [shuffled[i],shuffled[j]] = [shuffled[j],shuffled[i]];
    }
    return shuffled.slice(0,max);
  }
  function paginate(cards) {
    const size = 12;
    const pageCount = Math.max(1, Math.ceil(cards.length / size));
    const parsed = Number(new URL(location.href).searchParams.get('page'));
    const current = Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed,pageCount) : 1;
    cards.forEach((item,i) => { item.hidden = i < (current-1)*size || i >= current*size; });
    // Author CSS uses display:flex, so explicitly honor the hidden attribute.
    cards.forEach(item => { item.style.display = item.hidden ? 'none' : ''; });
    const start = cards.length ? (current-1)*size+1 : 0;
    document.getElementById('articleCount').textContent = `全${cards.length}記事 · ${start}〜${Math.min(current*size,cards.length)}件`;
    const link = (page,label) => `<a href="?page=${page}#article-catalogue">${label}</a>`;
    let links = current > 1 ? link(current-1,'前へ') : '';
    for (let i=1; i<=pageCount; i++) links += i===current ? `<span aria-current="page" aria-label="${i}ページ目">${i}</span>` : link(i,i);
    if (current < pageCount) links += link(current+1,'次へ');
    document.getElementById('articlePagination').innerHTML = links;
  }
  // Static cards remain usable without JavaScript or if data retrieval fails.
  if (catalogue) paginate([...catalogue.children]);
  Promise.all(['guides.json','columns.json'].map(async path => {
    const response = await fetch(path, {cache:'no-cache'});
    if (!response.ok) throw new Error(`${path}: ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error(`${path}: invalid catalogue`);
    return data;
  })).then(([guides,columns]) => {
    const articles = mergeArticles(guides,columns);
    if (!articles.length) return;
    if (home) home.innerHTML = pickRandom(articles).map(card).join('');
    if (catalogue) {
      catalogue.innerHTML = articles.map(card).join('');
      paginate([...catalogue.children]);
    }
  }).catch(error => console.warn('記事一覧の保存済み表示を使用します。',error));
})();
