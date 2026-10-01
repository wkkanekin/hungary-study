/* Native anchors and <details> work even without JavaScript. */
'use strict';
document.querySelectorAll('a[data-profile-link]').forEach(link => {
  link.addEventListener('click', () => {
    const card = document.getElementById(link.getAttribute('href').slice(1));
    if (!card) return;
    const details = card.querySelector('details');
    if (details) details.open = true;
    card.focus({ preventScroll: true });
  });
});
