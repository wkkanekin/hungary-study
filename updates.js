/* Standalone feed: existing script.js and existing JSON files are not modified. */
(function () {
  'use strict';
  const DAY = 86400000;
  const JST = 9 * 3600000;
  const SOURCES = [
    { url: 'guides.json', type: 'ガイド' },
    { url: 'columns.json', type: 'コラム' },
    { url: 'youtube.json', type: 'YouTube' },
    { url: 'announcements.json', type: 'お知らせ', customType: true }
  ];
  const TYPES = new Set(['ガイド', 'コラム', 'YouTube', 'サービス', 'お知らせ']);
  const dayKey = time => Math.floor((time + JST) / DAY);

  // Date-only data means midnight in Japan, irrespective of visitor timezone.
  // Timestamps must include Z or a numeric timezone; ambiguous values are excluded.
  function parseDate(value) {
    if (typeof value !== 'string') return NaN;
    const s = value.trim();
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2}))?$/.exec(s);
    if (!m) return NaN;
    const date = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
    if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== s.slice(0, 10)) return NaN;
    return Date.parse(s.length === 10 ? `${s}T00:00:00+09:00` : s);
  }

  function normalizeURL(value, base) {
    if (typeof value !== 'string' || !value.trim() || value.trim().startsWith('#')) return null;
    try {
      const url = new URL(value.trim(), base);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
      const internal = url.origin === new URL(base).origin || ['hungarystudy.org', 'www.hungarystudy.org'].includes(url.hostname);
      const key = new URL(url.href);
      key.hash = '';
      for (const name of [...key.searchParams.keys()]) {
        if (/^utm_/i.test(name) || ['fbclid', 'gclid'].includes(name)) key.searchParams.delete(name);
      }
      key.searchParams.sort();
      let identity = internal ? key.pathname.replace(/\/index\.html$/, '/').replace(/\/$/, '') + key.search : key.href;
      const ytHost = /^(www\.|m\.)?youtube\.com$/.test(url.hostname) || url.hostname === 'youtu.be';
      if (ytHost) {
        const video = url.hostname === 'youtu.be' ? url.pathname.slice(1) :
          url.searchParams.get('v') || (/^\/(?:embed|shorts)\/([^/]+)/.exec(url.pathname) || [])[1];
        if (video) identity = `youtube:${video}`;
      }
      return { href: url.href, key: identity, external: !internal };
    } catch (_) { return null; }
  }

  function buildItems(groups, now, base) {
    const items = [];
    for (const group of groups) {
      if (!Array.isArray(group.data)) continue;
      for (const raw of group.data) {
        if (!raw || raw.enabled !== true || raw.draft === true || raw.published === false || raw.comingSoon === true) continue;
        if (raw.status != null && raw.status !== 'published') continue;
        const time = parseDate(raw.publishedAt ?? raw.date);
        const link = normalizeURL(raw.url, base);
        const title = typeof raw.title === 'string' ? raw.title.trim() : '';
        if (!Number.isFinite(time) || time > now || !link || !title) continue;
        const type = group.customType && TYPES.has(raw.type) ? raw.type : group.type;
        const date = new Date(time + JST).toISOString().slice(0, 10);
        items.push({ title, type, time, date, ...link,
          isNew: dayKey(now) - dayKey(time) >= 0 && dayKey(now) - dayKey(time) < 7 });
      }
    }
    // Stable tie order follows source order and then the original JSON order.
    items.sort((a, b) => b.time - a.time);
    const seen = new Set();
    return items.filter(item => {
      if (seen.has(item.key)) return false;
      seen.add(item.key);
      return true;
    });
  }

  if (typeof module === 'object' && module.exports) {
    module.exports = { parseDate, normalizeURL, buildItems, SOURCES };
  }
  if (typeof document === 'undefined') return;
  const list = document.getElementById('updates-list');
  const status = document.getElementById('updates-status');
  if (!list || !status) return;
  let running = false;
  let signature = '';

  function render(items, failures) {
    const shown = items.slice(0, 5);
    const nextSignature = JSON.stringify(shown);
    // Do not replace links (and keyboard focus) during an unchanged refresh.
    if (signature !== nextSignature) {
      signature = nextSignature;
      const fragment = document.createDocumentFragment();
      shown.forEach(item => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.className = 'updatesLink';
        a.href = item.href;
        if (item.external) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
        const date = document.createElement('time');
        date.className = 'updatesDate'; date.dateTime = item.date; date.textContent = item.date.replace(/-/g, '/');
        const type = document.createElement('span');
        type.className = 'updatesType'; type.textContent = item.type;
        const title = document.createElement('span');
        title.className = 'updatesTitle';
        title.textContent = ['ガイド', 'コラム', 'YouTube'].includes(item.type) ? `「${item.title}」を公開しました` : item.title;
        if (item.external) {
          const external = document.createElement('span');
          external.className = 'updatesExternal'; external.textContent = '↗';
          external.setAttribute('aria-label', '別タブで開きます'); title.append(external);
        }
        a.append(date, type, title);
        if (item.isNew) {
          const badge = document.createElement('span'); badge.className = 'updatesNew'; badge.textContent = 'NEW'; a.append(badge);
        }
        li.append(a); fragment.append(li);
      });
      list.replaceChildren(fragment);
    }
    status.hidden = !!shown.length && !failures;
    status.textContent = failures ? (shown.length ? '一部の更新情報を取得できませんでした。時間をおいて再取得します。' : '更新情報を取得できませんでした。時間をおいて再取得します。') : (shown.length ? '' : '掲載できる更新情報はまだありません。');
  }

  async function fetchSource(source) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const url = new URL(source.url, document.baseURI);
      url.searchParams.set('_updates', String(Date.now()));
      const response = await fetch(url.href, { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error('Expected a JSON array');
      return { ...source, data };
    } finally { clearTimeout(timeout); }
  }

  async function refresh() {
    if (running) return;
    running = true;
    try {
      const results = await Promise.allSettled(SOURCES.map(fetchSource));
      const groups = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      render(buildItems(groups, Date.now(), document.baseURI), results.length - groups.length);
    } catch (error) {
      // Confine unexpected failures to this component.
      console.warn('更新情報を表示できませんでした', error);
      status.hidden = false; status.textContent = '更新情報を取得できませんでした。時間をおいて再取得します。';
    } finally { running = false; }
  }
  refresh();
  setInterval(refresh, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();
