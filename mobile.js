// Move the original controls so tab IDs, selected states and listeners stay shared.
(() => {
  const media = matchMedia('(max-width: 700px), (max-width: 900px) and (max-height: 450px)');
  const sidebar = document.querySelector('.side-menu');
  const tabs = document.querySelector('.main-tabs');
  const settings = document.getElementById('settingsButton');
  const timer = document.getElementById('timerStatus');
  const bar = document.createElement('div');
  bar.className = 'mobile-tabs';
  document.body.append(bar);
  function layout() {
    if (media.matches) bar.append(tabs, settings);
    else { sidebar.insertBefore(tabs, timer); sidebar.append(settings); }
  }
  media.addEventListener('change', layout);
  layout();
  const search = document.querySelector('.search-box');
  const toggle = document.createElement('button');
  toggle.className = 'mobile-search-toggle';
  toggle.type = 'button';
  toggle.textContent = '⌕';
  toggle.setAttribute('aria-label', 'Search stories');
  toggle.setAttribute('aria-controls', 'searchInput');
  toggle.setAttribute('aria-expanded', 'false');
  search.before(toggle);
  toggle.addEventListener('click', () => {
    const expanded = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(expanded));
    search.classList.toggle('expanded', expanded);
    if (expanded) document.getElementById('searchInput').focus();
  });
  document.getElementById('surpriseButton').setAttribute('aria-label', 'Surprise me');
})();
