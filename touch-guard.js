// App-wide long-press guard. iOS/Android treat a long press as "select text / show Copy · Look Up · Translate /
// drag the image", which also cancels the pointer mid-drag. Only real text fields may select text.
(() => {
  const AREAS = '#gamesView, #quizmoView, .main-tabs, .mobile-tabs';
  const EDITABLE = 'input, textarea, [contenteditable], [contenteditable] *';
  const editable = t => t instanceof Element && !!t.closest(EDITABLE);
  const el = t => t instanceof Element ? t : t?.parentElement;
  // No selection, no image drag anywhere outside text fields; no long-press/context menu on game surfaces and buttons.
  document.addEventListener('selectstart', e => { if (!editable(el(e.target))) e.preventDefault(); }, { capture: true });
  document.addEventListener('dragstart', e => { if (!editable(el(e.target))) e.preventDefault(); }, { capture: true });
  document.addEventListener('contextmenu', e => { const t = el(e.target); if (t && !editable(t) && t.closest(`${AREAS}, button, [role=button], label`)) e.preventDefault(); }, { capture: true });
  // Anything that still slips through (e.g. iOS word selection) is cleared at once unless a text field is focused.
  const clear = () => {
    const sel = window.getSelection?.();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;
    if (editable(document.activeElement) || editable(el(sel.anchorNode))) return;
    sel.removeAllRanges();
  };
  document.addEventListener('selectionchange', clear);
  document.addEventListener('pointerup', clear, { capture: true });
  // Long presses on game buttons: cancel the touch's default (selection loupe/callout) only where it is safe.
  // These buttons act on pointerup (games.js / quizmo.js), so taps keep working; we skip it whenever the
  // finger could be starting a scroll, so scrolling lists and the game hub still scroll.
  const scrollable = node => {
    for (let n = node; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if ((/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 1) || (/(auto|scroll)/.test(cs.overflowX) && n.scrollWidth > n.clientWidth + 1)) return true;
    }
    const d = document.scrollingElement || document.documentElement;
    return d.scrollHeight > innerHeight + 1 || d.scrollWidth > innerWidth + 1;
  };
  document.addEventListener('touchstart', e => {
    const t = el(e.target);
    const b = t?.closest('#gamesView button[data-action], #quizmoView button[data-q-action]');
    if (!b || editable(t) || b.closest('dialog, form') || e.touches.length > 1 || scrollable(b)) return;
    if (e.cancelable) e.preventDefault();
  }, { capture: true, passive: false });
})();
// When a new app version takes over, reload once so the open page picks up the new CSS/JS immediately
// (otherwise the first launch after an update still runs the old files). Never interrupts the story reader.
(() => {
  if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
  let pending = false;
  const reload = () => { if (pending) { pending = false; location.reload(); } };
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    pending = true;
    if (!document.getElementById('readerView')?.classList.contains('active')) reload();
    else document.addEventListener('visibilitychange', () => { if (document.hidden) reload(); }, { once: true });
  });
})();
