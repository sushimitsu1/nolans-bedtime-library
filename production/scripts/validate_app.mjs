import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

function argument(name, fallback = undefined) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function extractStories(source) {
  const marker = 'const stories =';
  const start = source.indexOf(marker);
  if (start < 0) throw new Error('Could not find const stories in app.js');
  const arrayStart = source.indexOf('[', start + marker.length);
  let depth = 0;
  let quote = null;
  let escaped = false;
  for (let index = arrayStart; index < source.length; index += 1) {
    const char = source[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) quote = null;
      continue;
    }
    if (char === "'" || char === '"' || char === '`') { quote = char; continue; }
    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) return source.slice(arrayStart, index + 1);
    }
  }
  throw new Error('Could not find the end of the stories array');
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  }
  return value;
}

function hash(value) {
  return crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

const appPath = argument('--app', 'app.js');
const root = path.resolve(argument('--assets-root', '.'));
const baselinePath = argument('--baseline', 'production/reports/app-baseline.json');
const expectedSlugs = (argument('--expected-slugs', '') || '').split(',').filter(Boolean);
const expectedIncrease = Number(argument('--expected-increase', '0'));
const writeBaseline = process.argv.includes('--write-baseline');
const source = fs.readFileSync(appPath, 'utf8');
const context = {};
vm.runInNewContext(`stories = ${extractStories(source)}`, context, { timeout: 1000 });
const stories = context.stories;
const records = Object.fromEntries(stories.map(story => [story.id, hash(story)]));

if (writeBaseline) {
  fs.mkdirSync(path.dirname(baselinePath), { recursive: true });
  fs.writeFileSync(baselinePath, `${JSON.stringify({ count: stories.length, records }, null, 2)}\n`);
  console.log(`Wrote app baseline for ${stories.length} stories`);
  process.exit(0);
}

const errors = [];
for (const story of stories) {
  if (!Array.isArray(story.pages) || story.pages.length !== 15) errors.push(`${story.id}: expected exactly 15 page references`);
  if (new Set(story.pages || []).size !== (story.pages || []).length) errors.push(`${story.id}: duplicated page paths`);
  for (const asset of [story.cover, ...(story.pages || [])]) {
    if (!asset || !fs.existsSync(path.join(root, asset))) errors.push(`${story.id}: missing asset path ${asset}`);
  }
}
if (!fs.existsSync(baselinePath)) errors.push(`missing baseline ${baselinePath}`);
else {
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  if (stories.length !== baseline.count + expectedIncrease) errors.push(`library count changed by ${stories.length - baseline.count}; expected ${expectedIncrease}`);
  for (const [slug, previousHash] of Object.entries(baseline.records)) {
    if (expectedSlugs.includes(slug)) continue;
    if (!records[slug]) errors.push(`unrelated story removed: ${slug}`);
    else if (records[slug] !== previousHash) errors.push(`unrelated story changed: ${slug}`);
  }
  for (const slug of expectedSlugs) if (!records[slug]) errors.push(`expected story missing: ${slug}`);
}

if (errors.length) {
  console.error('APP VALIDATION FAILED');
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}
console.log('APP VALIDATION PASSED');
