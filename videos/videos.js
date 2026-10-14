/* Independent video library; media is never stored for offline playback. */
(() => {
  const root = document.getElementById('videosView');
  const tab = document.getElementById('videosTab');
  let loaded = false, opener, down;
  const overlay = document.createElement('section');
  overlay.className = 'video-player';
  overlay.hidden = true;
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Video player');
  overlay.innerHTML = '<button type="button" class="video-close" aria-label="Close video">✕</button><video playsinline preload="none"></video><div class="video-controls"><button type="button" data-video-action="play" aria-label="Play video">▶</button><button type="button" data-video-action="pause" aria-label="Pause video">Ⅱ</button></div><p class="video-feedback" role="status"></p>';
  document.body.append(overlay);
  const media = overlay.querySelector('video');
  const feedback = overlay.querySelector('.video-feedback');
  function close() {
    if (overlay.hidden) return;
    media.pause(); media.removeAttribute('src'); media.load();
    overlay.hidden = true; document.body.classList.remove('video-open'); document.documentElement.classList.remove('video-open');
    opener?.focus();
  }
  function empty(unavailable = false) {
    root.replaceChildren();
    const state = document.createElement('div');
    state.className = 'videos-empty';
    state.innerHTML = '<div class="videos-friend" aria-hidden="true">🚙 🌙 ✨</div><h1>Videos coming soon</h1><p>Our sleepy friends are getting ready for movie time.</p>';
    if (unavailable) state.querySelector('p').textContent = 'Movie time will be ready when we can connect again.';
    root.append(state);
  }
  async function load() {
    if (loaded) return;
    loaded = true;
    try {
      const response = await fetch('videos.json');
      if (!response.ok) throw Error('Unavailable list');
      const list = await response.json();
      if (!Array.isArray(list.videos)) throw Error('Invalid list');
      if (!list.videos.length) { empty(); return; }
      const grid = document.createElement('div'); grid.className = 'video-grid';
      for (const item of list.videos) {
        if (!['id','title','src','thumbnail'].every(key => typeof item[key] === 'string' && item[key])) continue;
        const card = document.createElement('button');
        card.type = 'button'; card.className = 'video-card';
        const image = document.createElement('img'); image.src = item.thumbnail; image.alt = ''; image.loading = 'lazy';
        const title = document.createElement('span'); title.textContent = '▶ ' + item.title;
        card.append(image, title);
        activate(card, () => {
          opener = card; feedback.textContent = ''; overlay.hidden = false;
          document.body.classList.add('video-open'); document.documentElement.classList.add('video-open'); media.src = item.src; media.poster = item.thumbnail;
          overlay.querySelector('[data-video-action="play"]').focus();
        });
        grid.append(card);
      }
      if (!grid.children.length) { empty(); return; }
      const heading = document.createElement('h1'); heading.textContent = 'Pick a cozy video';
      root.replaceChildren(heading, grid);
    } catch { loaded = false; empty(true); }
  }
  // Pointer taps support touch and mouse; scrolling/cancellation never activates.
  function activate(button, action) {
    button.addEventListener('pointerdown', e => {
      if (e.isPrimary === false || e.button !== 0) return;
      down = {button, id:e.pointerId, x:e.clientX, y:e.clientY};
    });
    button.addEventListener('pointerup', e => {
      const tap = down; down = null;
      if (tap?.button === button && tap.id === e.pointerId && Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<24) action();
    });
    button.addEventListener('pointercancel', () => { down = null; });
    button.addEventListener('click', e => { if (e.detail === 0) action(); });
  }
  activate(tab, () => { showView('videos'); load(); });
  activate(overlay.querySelector('.video-close'), close);
  activate(overlay.querySelector('[data-video-action="play"]'), () => {
    feedback.textContent = '';
    media.play().catch(() => { feedback.textContent = 'This video cannot play right now. Please try again.'; });
  });
  activate(overlay.querySelector('[data-video-action="pause"]'), () => media.pause());
  media.addEventListener('error', () => { if (!overlay.hidden) feedback.textContent = 'This video cannot play right now. Please try again.'; });
  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const buttons = [...overlay.querySelectorAll('button')];
      const index = buttons.indexOf(document.activeElement);
      e.preventDefault(); buttons[(index + (e.shiftKey ? buttons.length-1 : 1)) % buttons.length].focus();
    }
  });
  window.NolanVideos = {close};
  empty();
})();
