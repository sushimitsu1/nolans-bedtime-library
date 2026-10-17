#!/usr/bin/env node
// Pre-render story narration with Google Cloud Text-to-Speech, one MP3 per page.
//
//   GOOGLE_TTS_API_KEY=... node production/scripts/narrate_google.mjs <slug> [<slug> ...]
//   GOOGLE_TTS_API_KEY=... node production/scripts/narrate_google.mjs --all [--concurrency 3]
//   node production/scripts/narrate_google.mjs --all --dry-run      (count characters only, no API calls)
//
// Text comes from the stories array in app.js (speechText[i] || narration[i], cleaned with the
// app's own prepareSpeechText), exactly like narrate_story.mjs, so the audio matches the reader.
// Output: assets/narration/<slug>/p<N>.mp3 re-encoded to mono 96 kbps (ffmpeg) + assets/narration/manifest.json.
// Existing page files are skipped. A story is only listed in the manifest once every page exists.
// 429 / 5xx responses are retried with backoff; 400/401/403 stop the run cleanly (exit 2).
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import os from 'node:os';
import process from 'node:process';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const optionNames = new Set(['--voice', '--concurrency', '--limit-chars']);
const slugs = args.filter((a, i) => !a.startsWith('--') && !optionNames.has(args[i - 1]));

const VOICE = option('--voice', 'en-US-Chirp3-HD-Sulafat'); // picked by the family
const VOICE_NAME = VOICE.split('-').pop();
const LANGUAGE = VOICE.split('-').slice(0, 2).join('-');
const CONCURRENCY = Math.max(1, Number(option('--concurrency', '3')));
const LIMIT_CHARS = Number(option('--limit-chars', 'Infinity'));
const DRY_RUN = flag('--dry-run');
const narrationDir = path.join(root, 'assets/narration');
const manifestPath = path.join(narrationDir, 'manifest.json');
const HAS_FFMPEG = (() => { try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

function loadAppStories() {
  const source = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const storiesEnd = source.indexOf('\n];') + 3;
  const helpersStart = source.indexOf('const SPEECH_SOUND_PRONUNCIATIONS');
  const helpersEnd = source.indexOf('const VOICE_QUALITY_INDICATORS');
  const prepStart = source.indexOf('function prepareSpeechText');
  const prepEnd = source.indexOf('function isEnglishVoice');
  if (storiesEnd < 3 || [helpersStart, helpersEnd, prepStart, prepEnd].some(i => i < 0)) throw new Error('Could not parse app.js');
  const context = {};
  vm.runInNewContext(`${source.slice(0, storiesEnd)}\n${source.slice(helpersStart, helpersEnd)}\n${source.slice(prepStart, prepEnd)}\nthis.stories=stories;this.prepareSpeechText=prepareSpeechText;`, context, { timeout: 2000 });
  return context;
}

function pageTexts(story, prepareSpeechText) {
  return story.pages.map((_, i) => {
    const raw = (Array.isArray(story.speechText) && story.speechText[i]) || story.narration?.[i] || '';
    return prepareSpeechText(String(raw).trim()).trim();
  });
}

const sha = text => crypto.createHash('sha256').update(text).digest('hex').slice(0, 16);
const sleep = ms => new Promise(r => setTimeout(r, ms));

function readManifest() {
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return { version: 1, stories: {} }; }
}
function writeManifest(manifest) {
  const sorted = Object.fromEntries(Object.keys(manifest.stories).sort().map(k => [k, manifest.stories[k]]));
  fs.mkdirSync(narrationDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify((({ stories, ...header }) => ({ ...header, stories: sorted }))(manifest), null, 2)}\n`);
}

class StopRun extends Error {}

async function synthesize(text) {
  for (let attempt = 1; ; attempt++) {
    let response;
    try {
      response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${encodeURIComponent(process.env.GOOGLE_TTS_API_KEY)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { text }, voice: { languageCode: LANGUAGE, name: VOICE }, audioConfig: { audioEncoding: 'MP3' } })
      });
    } catch (error) {
      if (attempt >= 6) throw new Error(`Network error: ${error.message}`);
      await sleep(2000 * attempt); continue;
    }
    if (response.ok) return Buffer.from((await response.json()).audioContent, 'base64');
    const body = await response.text();
    let message = body;
    try { message = JSON.parse(body).error?.message || body; } catch {}
    if ((response.status === 429 || response.status >= 500) && attempt < 8) {
      const wait = Math.min(60000, 3000 * 2 ** (attempt - 1));
      console.warn(`HTTP ${response.status}, retrying in ${wait / 1000}s (attempt ${attempt})`);
      await sleep(wait); continue;
    }
    throw new StopRun(`Google TTS stopped the run (HTTP ${response.status}): ${message}`);
  }
}

function toMono96(mp3) {
  if (!HAS_FFMPEG) return mp3;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gtts-'));
  try {
    fs.writeFileSync(path.join(tmp, 'in.mp3'), mp3);
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(tmp, 'in.mp3'), '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '96k', '-map_metadata', '-1', path.join(tmp, 'out.mp3')]);
    return fs.readFileSync(path.join(tmp, 'out.mp3'));
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

async function main() {
  if (!flag('--all') && !slugs.length) {
    console.error('Usage: node production/scripts/narrate_google.mjs <slug> [...] | --all [--dry-run] [--concurrency N] [--limit-chars N] [--voice NAME]');
    process.exit(64);
  }
  const { stories, prepareSpeechText } = loadAppStories();
  const selected = flag('--all') ? stories : slugs.map(slug => stories.find(s => s.id === slug) || (() => { throw new Error(`Unknown story slug: ${slug}`); })());
  if (!DRY_RUN && !process.env.GOOGLE_TTS_API_KEY) { console.error('GOOGLE_TTS_API_KEY is not set.'); process.exit(64); }

  const manifest = readManifest();
  const listed = Object.keys(manifest.stories || {});
  if (!DRY_RUN && listed.length && manifest.voiceId && manifest.voiceId !== VOICE) {
    console.error(`Manifest lists stories made with voice ${manifest.voiceId}; refusing to mix voices. Archive them first.`);
    process.exit(64);
  }
  const base = { version: 1, voice: VOICE_NAME, voiceId: VOICE, provider: 'google-cloud-tts', model: 'chirp3-hd' };
  for (const k of ['model']) delete manifest[k];
  Object.assign(manifest, base);

  let used = 0, pending = 0, made = 0, skipped = 0, failed = 0;
  let stopMessage = '';
  const jobs = [];
  for (const story of selected) {
    const texts = pageTexts(story, prepareSpeechText);
    const dir = path.join(narrationDir, story.id);
    const missing = texts.map((t, i) => i).filter(i => texts[i] && !fs.existsSync(path.join(dir, `p${i + 1}.mp3`)));
    const missingChars = missing.reduce((n, i) => n + texts[i].length, 0);
    pending += missingChars;
    skipped += texts.length - missing.length;
    if (DRY_RUN) { console.log(`${story.id}: ${missing.length} page(s) to make, ${missingChars} chars`); continue; }
    jobs.push({ story, texts, dir, missing });
  }

  if (!DRY_RUN) {
    const finishStory = ({ story, texts, dir }) => {
      if (texts.every((t, i) => !t || fs.existsSync(path.join(dir, `p${i + 1}.mp3`)))) {
        manifest.stories[story.id] = { pages: texts.length, textHash: sha(texts.join('\n')), voice: VOICE };
        writeManifest(manifest);
      }
    };
    for (const job of jobs) {
      if (stopMessage) break;
      let next = 0;
      const worker = async () => {
        while (!stopMessage && next < job.missing.length) {
          const i = job.missing[next++];
          const text = job.texts[i];
          if (used + text.length > LIMIT_CHARS) { stopMessage = `Stopped at --limit-chars ${LIMIT_CHARS}.`; return; }
          used += text.length;
          try {
            const audio = toMono96(await synthesize(text));
            fs.mkdirSync(job.dir, { recursive: true });
            fs.writeFileSync(path.join(job.dir, `p${i + 1}.mp3`), audio);
            made += 1;
          } catch (error) {
            if (error instanceof StopRun) { stopMessage = error.message; return; }
            failed += 1; console.error(`${job.story.id} p${i + 1} failed: ${error.message}`);
          }
        }
      };
      await Promise.all(Array.from({ length: CONCURRENCY }, worker));
      finishStory(job);
      console.log(`${job.story.id}: ${job.missing.length} page(s) attempted (run total ${used} chars, ${made} made)`);
    }
    writeManifest(manifest);
  }
  console.log(`\n${DRY_RUN ? 'Dry run' : 'Done'}: ${selected.length} stor${selected.length === 1 ? 'y' : 'ies'}, ${made} page(s) made, ${skipped} already existed, ${failed} failed, ${DRY_RUN ? `${pending} chars would be used` : `${used} chars sent`}.`);
  if (stopMessage) { console.error(`\n${stopMessage}`); process.exit(2); }
  if (failed) process.exit(1);
}

main().catch(error => { console.error(error.message.replace(/key=[^&\s"]+/g, 'key=REDACTED')); process.exit(1); });
