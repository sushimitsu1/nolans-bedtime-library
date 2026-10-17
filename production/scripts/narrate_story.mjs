#!/usr/bin/env node
// Pre-render story narration with ElevenLabs, one MP3 per page.
//
//   ELEVENLABS_API_KEY=... node production/scripts/narrate_story.mjs <slug> [<slug> ...]
//   ELEVENLABS_API_KEY=... node production/scripts/narrate_story.mjs --all
//   node production/scripts/narrate_story.mjs --all --dry-run      (count characters only, no API calls)
//
// Text comes from the stories array in app.js (speechText[i] || narration[i], cleaned with the
// app's own prepareSpeechText) so the audio says exactly what the browser voice would say.
// Output: assets/narration/<slug>/p<N>.mp3 (N = 1..15) and assets/narration/manifest.json.
// Existing page files are skipped. A story is only listed in the manifest once every page exists.
// Quota/rate-limit errors (401 quota_exceeded, 429) stop the run cleanly; rerun later to resume.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import process from 'node:process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const args = process.argv.slice(2);
const flag = name => args.includes(name);
const option = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const optionNames = new Set(['--voice-id', '--model', '--format', '--limit-chars']);
const slugs = args.filter((a, i) => !a.startsWith('--') && !optionNames.has(args[i - 1]));

const VOICE_ID = option('--voice-id', 'XrExE9yKIg1WjnnlVkGX'); // Matilda (picked by the family)
const VOICE_NAME = VOICE_ID === 'XrExE9yKIg1WjnnlVkGX' ? 'Matilda' : VOICE_ID;
const MODEL_ID = option('--model', 'eleven_multilingual_v2');
const OUTPUT_FORMAT = option('--format', 'mp3_44100_96'); // ElevenLabs MP3s are mono
const LIMIT_CHARS = Number(option('--limit-chars', 'Infinity'));
const VOICE_SETTINGS = { stability: 0.7, similarity_boost: 0.75, style: 0.15, use_speaker_boost: true, speed: 0.9 };
const DRY_RUN = flag('--dry-run');
const narrationDir = path.join(root, 'assets/narration');
const manifestPath = path.join(narrationDir, 'manifest.json');

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

function readManifest() {
  try { return JSON.parse(fs.readFileSync(manifestPath, 'utf8')); } catch { return { version: 1, voice: VOICE_NAME, voiceId: VOICE_ID, model: MODEL_ID, stories: {} }; }
}
function writeManifest(manifest) {
  const sorted = Object.fromEntries(Object.keys(manifest.stories).sort().map(k => [k, manifest.stories[k]]));
  fs.mkdirSync(narrationDir, { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify({ ...manifest, stories: sorted }, null, 2)}\n`);
}

class StopRun extends Error {}

async function synthesize(text) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}?output_format=${OUTPUT_FORMAT}`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
    body: JSON.stringify({ text, model_id: MODEL_ID, voice_settings: VOICE_SETTINGS })
  });
  if (!response.ok) {
    const body = await response.text();
    let detail = {};
    try { detail = JSON.parse(body).detail || {}; } catch {}
    const status = typeof detail === 'object' ? detail.status || detail.code : '';
    const message = typeof detail === 'object' ? detail.message || body : String(detail);
    if (response.status === 429 || status === 'quota_exceeded' || /quota/i.test(message)) {
      throw new StopRun(`ElevenLabs stopped the run (HTTP ${response.status}${status ? ` ${status}` : ''}): ${message}\nCredits or rate limit reached. Nothing is broken; rerun later and finished pages will be skipped.`);
    }
    if (response.status === 401 || response.status === 403) throw new StopRun(`ElevenLabs refused the key (HTTP ${response.status}${status ? ` ${status}` : ''}): ${message}`);
    throw new Error(`ElevenLabs HTTP ${response.status}: ${message}`);
  }
  const cost = Number(response.headers.get('character-cost'));
  return { audio: Buffer.from(await response.arrayBuffer()), cost: Number.isFinite(cost) ? cost : text.length };
}

async function main() {
  if (!flag('--all') && !slugs.length) {
    console.error('Usage: node production/scripts/narrate_story.mjs <slug> [...] | --all [--dry-run] [--limit-chars N] [--voice-id ID]');
    process.exit(64);
  }
  const { stories, prepareSpeechText } = loadAppStories();
  const selected = flag('--all') ? stories : slugs.map(slug => stories.find(s => s.id === slug) || (() => { throw new Error(`Unknown story slug: ${slug}`); })());
  if (!DRY_RUN && !process.env.ELEVENLABS_API_KEY) { console.error('ELEVENLABS_API_KEY is not set.'); process.exit(64); }

  const manifest = readManifest();
  if (!DRY_RUN && manifest.voiceId && manifest.voiceId !== VOICE_ID) {
    console.error(`Manifest was made with voice ${manifest.voiceId}; refusing to mix voices. Use a matching --voice-id.`);
    process.exit(64);
  }
  Object.assign(manifest, { version: 1, voice: VOICE_NAME, voiceId: VOICE_ID, model: MODEL_ID });

  let used = 0, pending = 0, made = 0, skipped = 0;
  let stopMessage = '';
  try {
    for (const story of selected) {
      const texts = pageTexts(story, prepareSpeechText);
      const dir = path.join(narrationDir, story.id);
      const missing = texts.map((t, i) => i).filter(i => texts[i] && !fs.existsSync(path.join(dir, `p${i + 1}.mp3`)));
      const missingChars = missing.reduce((n, i) => n + texts[i].length, 0);
      pending += missingChars;
      skipped += texts.length - missing.length;
      if (DRY_RUN) { console.log(`${story.id}: ${missing.length} page(s) to make, ${missingChars} chars`); continue; }
      for (const i of missing) {
        if (used + texts[i].length > LIMIT_CHARS) throw new StopRun(`Stopped at --limit-chars ${LIMIT_CHARS}.`);
        const { audio, cost } = await synthesize(texts[i]);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `p${i + 1}.mp3`), audio);
        used += cost; made += 1;
        console.log(`${story.id} p${i + 1}: ${cost} chars (run total ${used})`);
      }
      if (texts.every((t, i) => !t || fs.existsSync(path.join(dir, `p${i + 1}.mp3`)))) {
        manifest.stories[story.id] = { pages: texts.length, textHash: sha(texts.join('\n')) };
        writeManifest(manifest);
      }
    }
  } catch (error) {
    if (!(error instanceof StopRun)) throw error;
    stopMessage = error.message;
  }
  if (!DRY_RUN) writeManifest(manifest);
  console.log(`\n${DRY_RUN ? 'Dry run' : 'Done'}: ${selected.length} stor${selected.length === 1 ? 'y' : 'ies'}, ${made} page(s) made, ${skipped} already existed, ${DRY_RUN ? `${pending} chars would be used` : `${used} chars used`}.`);
  if (stopMessage) { console.error(`\n${stopMessage}`); process.exit(2); }
}

main().catch(error => { console.error(error.message); process.exit(1); });
