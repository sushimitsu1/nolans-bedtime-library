// Family lock smoke test. Needs NOLAN_FAMILY_PASSWORD in the environment (never printed).
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {existsSync} from 'node:fs';
const ppPath = ['/tmp/shot/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js', '/tmp/shot/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js'].find(existsSync);
const {default: puppeteer} = await import(ppPath);
const CODE = process.env.NOLAN_FAMILY_PASSWORD;
assert(CODE, 'Set NOLAN_FAMILY_PASSWORD to run this test');
const root = path.dirname(new URL(import.meta.url).pathname);
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain'};
const server = http.createServer(async (req, res) => { try { const name = new URL(req.url, 'http://localhost').pathname; const file = path.resolve(root, '.' + (name === '/' ? '/index.html' : name)); if (!file.startsWith(root + '/')) throw Error(); res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(await fs.readFile(file)); } catch { res.writeHead(404); res.end(); } });
await new Promise(r => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
const visibleContent = page => page.evaluate(() => {
  const vis = sel => [...document.querySelectorAll(sel)].some(e => e.getClientRects().length > 0);
  return { locked: document.documentElement.classList.contains('locked'), lockShown: vis('#familyLock'), stories: vis('.story-card'), menu: vis('.side-menu'), reader: vis('#readerView'), games: vis('#gamesView'), text: document.body.innerText };
});
let failures = 0; const ok = (name, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + name); if (!cond) failures++; };
try {
  const ctx = await browser.createBrowserContext();
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  // Seed state as if a story were in progress, to check nothing leaks while locked.
  await page.goto(base + '/robots.txt');
  ok('robots.txt disallows all', /User-agent: \*\s+Disallow: \/\s*$/.test(await page.evaluate(() => document.body.innerText)));
  await page.goto(base + '/');
  ok('noindex meta present', (await page.$eval('meta[name=robots]', m => m.content)) === 'noindex,nofollow');
  let s = await visibleContent(page);
  ok('locked on first visit, lock screen shown', s.locked && s.lockShown);
  ok('no story cards / menu visible while locked', !s.stories && !s.menu && !s.reader && !s.games);
  ok('no story titles in visible text while locked', !/Tonight's stories|Monster Jam|Quizmo/.test(s.text));
  ok('input is numeric keyboard and selectable', await page.$eval('#familyLockInput', i => i.inputMode === 'numeric' && getComputedStyle(i).userSelect !== 'none'));
  // Keys while locked must not drive the app.
  await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape');
  // Wrong code.
  await page.type('#familyLockInput', '000000' === CODE ? '111111' : '000000');
  await page.click('#familyLockButton');
  await page.waitForFunction(() => document.getElementById('familyLockError').textContent.length > 0);
  s = await visibleContent(page);
  ok('wrong code rejected with message', s.locked && /not the family code/.test(await page.$eval('#familyLockError', e => e.textContent)));
  ok('wrong code not remembered', (await page.evaluate(() => localStorage.getItem('nolan:familyUnlock'))) === null);
  // Paste works (simulate paste via insertText), then unlock.
  await page.focus('#familyLockInput');
  await page.evaluate(code => document.execCommand('insertText', false, ' ' + code + ' '), CODE);
  ok('pasted text lands in input', (await page.$eval('#familyLockInput', i => i.value.trim().length)) === CODE.length);
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.documentElement.classList.contains('locked'), { timeout: 10000 });
  s = await visibleContent(page);
  ok('right code unlocks; library visible', !s.locked && !s.lockShown && s.stories && s.menu);
  ok('100 story cards render', (await page.$$eval('.story-card', e => e.length)) === 100);
  await page.reload();
  s = await visibleContent(page);
  ok('reload stays unlocked', !s.locked && !s.lockShown && s.stories);
  // App still works: open a story, games, quizmo, monster jam.
  await page.click('.read-button'); await page.click('#nextButton');
  await page.waitForFunction(() => { const i = document.getElementById('pageImage'); return i.complete && i.naturalWidth > 0; });
  ok('story reader works after unlock', await page.$eval('#readerView', e => e.classList.contains('active')));
  await page.click('#backButton');
  await page.click('[data-category="Monster Jam"]');
  ok('Monster Jam section shows 16 stories', (await page.$$eval('.story-card', e => e.length)) === 16);
  await page.click('#gamesTab'); ok('games hub renders', await page.$eval('#gamesView', e => e.classList.contains('active') && e.children.length > 0));
  await page.click('#quizmoTab'); ok('quizmo renders', await page.$eval('#quizmoView', e => e.classList.contains('active') && e.children.length > 0));
  // Offline / home-screen: service worker serves the app and the device stays unlocked.
  await page.goto(base + '/'); await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); await page.waitForFunction(() => !!navigator.serviceWorker.controller, { timeout: 15000 });
  await page.setOfflineMode(true); await page.reload();
  s = await visibleContent(page);
  ok('offline reload works and stays unlocked', !s.locked && s.stories);
  await page.setOfflineMode(false);
  ok('no page errors', errors.length === 0 || (console.log(errors), false));
  await ctx.close();
  // Fresh device: deep links are locked too.
  for (const url of ['/index.html', '/?story=monster-jam', '/#games', '/#quizmo', '/index.html?game=1#reader']) {
    const c = await browser.createBrowserContext(); const p = await c.newPage();
    await p.evaluateOnNewDocument(() => { try { localStorage.setItem('nolan:lastStory', 'x'); } catch {} });
    await p.goto(base + url); const v = await visibleContent(p);
    ok(`deep link ${url} locked`, v.locked && v.lockShown && !v.stories && !v.menu && !v.reader && !v.games);
    await c.close();
  }
  // A stale/forged unlock value does not open it.
  const c2 = await browser.createBrowserContext(); const p2 = await c2.newPage();
  await p2.evaluateOnNewDocument(() => localStorage.setItem('nolan:familyUnlock', 'yes'));
  await p2.goto(base + '/'); ok('bogus unlock value stays locked', (await visibleContent(p2)).locked); await c2.close();
} finally { await browser.close(); server.close(); }
console.log(failures ? `${failures} FAILED` : 'ALL PASSED'); process.exit(failures ? 1 : 0);
