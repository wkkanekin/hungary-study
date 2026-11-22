const universityCards = [...document.querySelectorAll('.universityItem')];
const universityFilters = document.querySelector('.universityFilters');
const universityCount = document.querySelector('#university-count');

function filterUniversities() {
  const query = document.querySelector('#university-query').value.trim().toLowerCase();
  const city = document.querySelector('#university-city').value;
  const kind = document.querySelector('#university-kind').value;
  const level = document.querySelector('#university-level').value;
  const mode = document.querySelector('#university-mode').value;
  let count = 0;
  for (const card of universityCards) {
    const matches = card.textContent.toLowerCase().includes(query)
      && (!city || city === card.dataset.city)
      && (!kind || kind === card.dataset.kind)
      && (!level || card.dataset.level.includes(level))
      && (!mode || Boolean(card.querySelector('a[href^="guide-"]')));
    card.hidden = !matches;
    count += Number(matches);
  }
  document.dispatchEvent(new CustomEvent('universities-filtered'));
  universityCount.textContent = count ? `${count}件` : '条件に一致する大学はありません。';
}

universityFilters.addEventListener('input', filterUniversities);
