# Locked narration voice workflow

## Why this exists

Before this lock-down, the repository had no file-based TTS provider or audio
generation integration. `production/scripts/generate_narration.py` only copied 15
exact page-text strings into `narration.json`. It did not generate audio.

The public app used the browser Web Speech API. It enumerated browser voices,
preferred Microsoft Aria or names containing quality terms, allowed a saved manual
selection, and then fell through English voices and the browser default. Voice
availability and voice URIs vary by browser and operating system, so that behavior
could change between devices. It also recorded no provider voice ID, source hash,
audio checksum, or listening review.

There were no provider credentials or TTS configuration in the repository, no
generated narration audio files, and no narration asset manifest containing a voice
ID. The existing eight `narration.json` files are exact-text inputs only and are
listed as `needs_review` in
`production/reports/legacy-narration-inventory.json`.

Three legacy text arrays also differ from the current preferred
`story.json pages[].speechText` source: Cora (Pages 4, 6, and 14), Pirate’s
Curse (Page 12), and ThunderROARus (Pages 3 and 15). They are preserved
unchanged and explicitly flagged. New generation fails on this disagreement
instead of guessing which text to speak.

## Policy

Nolan’s Big Vehicle Bedtime Library uses one locked primary human narrator across standard books. Only the approved backup may be used, and only explicitly. Random voices, provider-default voices, automatic voice discovery, character voice swapping, and unapproved substitutions are prohibited.

Human listening is required both to choose the two voices and to approve finished
narration. Automated checks can detect provenance, exact-text, format, silence,
clipping, checksum, and large duration problems, but cannot prove that a voice
sounds human.

## 1. Configure the provider

`config/narration-voices.json` intentionally starts with `provider`, primary voice,
and backup voice set to `null`. Do not put API keys in this file.

This repository currently supplies a provider-neutral command adapter because no
TTS provider was previously integrated. Configure:

- `provider`: the provider's exact stable identifier.
- `synthesis.adapter`: `command`.
- `synthesis.command`: an argument array for an installed provider CLI.
- `synthesis.model`: the exact provider model.
- `synthesis.settings`: the settings sent to that provider.
- `synthesis.output_format`: `mp3`, `wav`, `m4a`, `ogg`, or `flac`.

The command is run directly, never through a shell. Supported placeholders are
`{text_file}`, `{output_file}`, `{provider}`, `{voice_id}`, `{model}`, and
`{settings_json}`. The exact narration text is written to `{text_file}` as UTF-8.
The exact locked voice ID is passed as `{voice_id}`. The external provider CLI is
responsible for reading its credentials from its normal secure environment.

Example shape only—not a real provider command:

```json
{
  "provider": "REPLACE_WITH_PROVIDER_ID",
  "synthesis": {
    "adapter": "command",
    "command": [
      "REPLACE_WITH_PROVIDER_CLI",
      "--voice-id",
      "{voice_id}",
      "--input-file",
      "{text_file}",
      "--output-file",
      "{output_file}"
    ],
    "model": "REPLACE_WITH_EXACT_MODEL",
    "settings": {},
    "output_format": "mp3"
  }
}
```

No provider is selected by this change. No provider cost, quota, format guarantee,
or catalog limit can be stated until a real provider and model are chosen. The
command may incur that provider's charges when a human runs it. Automated tests use
a local fake adapter and spend no credits.

Browser Speech Synthesis has no repository credential, reliable cross-platform
voice catalog, or standard audio-file export. The app now uses it only when
`provider` is exactly `browser-speech-synthesis` and the approved primary
`voice_id` exactly matches an available `voiceURI`; otherwise browser narration
stops with “Locked narrator unavailable.” It never substitutes a default.

## 2. Supply a short candidate list

Copy `config/narration-candidates.example.json` to an untracked working file and
enter only the small set of voices you intend to audition. Do not fetch or add an
entire provider catalog. Each entry needs an exact `voice_id` and a human-friendly
`display_name`. The candidate `provider` must match the configured provider.

## 3. Generate auditions

From the repository root:

```bash
python production/scripts/audition_narration_voices.py \
  --candidates config/narration-candidates.json \
  --output-dir voice-auditions
```

The samples appear in `voice-auditions/`, with one file per candidate and
`voice-auditions/audition-manifest.json`. The script uses the locked audition text,
records its SHA-256, passes each exact candidate ID, and leaves every candidate
`not_approved`. Existing audition outputs are protected unless `--overwrite` is
explicitly supplied.

## 4. Listen to every audition

A human reviewer listens to every candidate and decides which human-sounding,
consistent narrator should be primary and which should be backup. The scripts do
not rank, discover, or approve voices.

## 5. Approve one primary and one backup

After the human decision:

```bash
python production/scripts/approve_narration_voices.py \
  --manifest voice-auditions/audition-manifest.json \
  --primary <EXACT_APPROVED_PRIMARY_VOICE_ID> \
  --backup <EXACT_APPROVED_BACKUP_VOICE_ID>
```

The command rejects identical, unknown, unauditioned, missing, or checksum-invalid
candidates. It writes exactly those two IDs to the allowlist. Changing an existing
approval requires `--replace`.

## 6. Generate story narration

The primary is the only default:

```bash
python production/scripts/generate_narration.py production/stories/<story-slug>
```

The approved backup is available only through an explicit retry:

```bash
python production/scripts/generate_narration.py \
  production/stories/<story-slug> \
  --use-backup
```

The output is one audio file per page in the story's `narration-audio/` directory.
`narration-manifest.json` records exact text and text hash, provider, exact voice
ID, role, model, settings, output checksum, audio metadata, timestamp, generation
status, and listening-review status. The story's `manifest.json` also records the
`voice_id`.

An existing audio file is reused only when its checksum, exact source-text hash,
provider, voice ID, model, and settings all match. Mismatched output causes a clear
failure unless `--overwrite` is explicit. There is no automatic backup retry.

The legacy two-positional-argument text-only command remains available:

```bash
python production/scripts/generate_narration.py \
  production/stories/<story-slug>/story.json \
  production/stories/<story-slug>/narration.json
```

It copies exact approved page narration and makes no TTS call.

## 7. Validate exact text and voice provenance

For technical checks before listening:

```bash
python production/scripts/validate_narration.py \
  production/stories/<story-slug>/narration-audio/narration-manifest.json \
  --story production/stories/<story-slug> \
  --technical-only
```

The final validation omits `--technical-only` and therefore fails until human
listening has passed:

```bash
python production/scripts/validate_narration.py \
  production/stories/<story-slug>/narration-audio/narration-manifest.json \
  --story production/stories/<story-slug>
```

## 8. Listen to the finished narration

Listen to all 15 page files in order. Compare every file with the exact approved
story text. Check for wrong voice, strange tone, distortion, skipped or added text,
clipping, silence, and inconsistent pacing.

## 9. Mark the human review result

```bash
python production/scripts/review_narration.py \
  production/stories/<story-slug>/narration-audio/narration-manifest.json \
  --story production/stories/<story-slug> \
  --status passed \
  --reviewer "Jay"
```

Supported statuses are `pending`, `passed`, `failed`, and `needs_regeneration`.
Non-pending results require a reviewer. Technical validation must pass before a
review result can be recorded.

## 10. Package only after validation passes

Run final narration validation without `--technical-only`. Packaging must stop if
the exact-text, voice, provenance, audio, or human-review checks fail.
