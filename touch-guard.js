// Long-press guard for game surfaces (Nolan's games, Jasper's Quizmo, the tab bar).
// iOS/Android treat a long press as "select text / show the copy callout / drag the image",
// which cancels the pointer and leaves pieces unresponsive. The story reader is not covered.
(() => {
  const AREAS = '#gamesView, #quizmoView, .main-tabs, dialog.quizmo-reward';
  const EDITABLE = 'input, textarea, select, [contenteditable], [contenteditable] *';
  const inArea = t => t instanceof Element && t.closest(AREAS) && !t.closest(EDITABLE);
  const block = e => { if (inArea(e.target)) e.preventDefault(); };
  document.addEventListener('contextmenu', block, { capture: true });
  document.addEventListener('selectstart', block, { capture: true });
  document.addEventListener('dragstart', block, { capture: true });
  // If a selection still slipped in (e.g. a double tap), clear it when the next touch starts in a game.
  document.addEventListener('pointerdown', e => {
    if (!inArea(e.target)) return;
    const sel = window.getSelection?.();
    if (sel && !sel.isCollapsed && sel.anchorNode && (sel.anchorNode.parentElement || sel.anchorNode).closest?.(AREAS)) sel.removeAllRanges();
  }, { capture: true });
})();
