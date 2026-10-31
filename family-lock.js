// Family lock: a light, client-side password screen so strangers and search engines don't wander in.
// Only a salted PBKDF2-SHA-256 hash of the family code is stored here, never the code itself.
// Loaded synchronously in <head> (before any content renders). <html class="locked"> is the default,
// so the library stays hidden unless this device was unlocked before.
(() => {
  const LOCK = { salt: 'f9bd2647b07403e95f3d8a35c85c9dde', iterations: 150000, hash: '9dd4bbfb24cb1f334e0ba0c5fd12be2078833360ed11013826042c03613d2887' };
  const KEY = 'nolan:familyUnlock';
  const root = document.documentElement;
  const stored = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
  if (stored() === LOCK.hash) { root.classList.remove('locked'); return; }
  root.classList.add('locked');

  // While locked, keep the app's keyboard shortcuts (page turns, Escape, etc.) from reacting to typing.
  // Typing and Enter-to-submit still work because default actions are not cancelled.
  const guard = e => { if (root.classList.contains('locked')) e.stopPropagation(); };
  const types = ['keydown', 'keyup', 'keypress'];
  types.forEach(t => window.addEventListener(t, guard, true));

  const hexToBytes = hex => new Uint8Array(hex.match(/../g).map(b => parseInt(b, 16)));
  const toHex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  const derive = async code => {
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(LOCK.salt), iterations: LOCK.iterations }, key, 256);
    return toHex(bits);
  };

  const unlock = () => {
    try { localStorage.setItem(KEY, LOCK.hash); } catch {}
    root.classList.remove('locked');
    types.forEach(t => window.removeEventListener(t, guard, true));
    document.getElementById('familyLock')?.remove();
    // Let any layout code that measured while hidden recompute.
    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('family-unlocked'));
  };

  const wire = () => {
    const form = document.getElementById('familyLockForm');
    const input = document.getElementById('familyLockInput');
    const error = document.getElementById('familyLockError');
    const button = document.getElementById('familyLockButton');
    const show = document.getElementById('familyLockShow');
    if (!form || !input) return;
    if (!(window.crypto && crypto.subtle)) {
      error.textContent = 'This device can only unlock the library over a secure (https) link.';
      button.disabled = true;
      return;
    }
    show?.addEventListener('click', () => {
      const hidden = input.type === 'password';
      input.type = hidden ? 'text' : 'password';
      show.textContent = hidden ? '🙈 Hide' : '👀 Show';
      show.setAttribute('aria-pressed', String(hidden));
      input.focus();
    });
    input.addEventListener('input', () => { error.textContent = ''; form.classList.remove('wrong'); });
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const code = input.value.trim();
      if (!code) { error.textContent = 'Type the family code first.'; input.focus(); return; }
      button.disabled = true;
      button.textContent = 'Checking…';
      let ok = false;
      try { ok = (await derive(code)) === LOCK.hash; } catch {}
      if (ok) { unlock(); return; }
      button.disabled = false;
      button.textContent = '🔓 Unlock';
      input.value = '';
      error.textContent = "Oops, that's not the family code. Please try again.";
      form.classList.remove('wrong'); void form.offsetWidth; form.classList.add('wrong');
      input.focus();
    });
    try { input.focus({ preventScroll: true }); } catch {}
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire, { once: true });
  else wire();
})();
