# Narration voice lock-down report

Date: 2026-07-29

Worktree:
`C:\Users\sushi\.codex\.chatgpt-projects\g-p-6a552630cfbc81919fcf9987ffcf3ad3\narration-voice-lock-worktree`

## Original problem and implementation audit

The repository did not contain a file-based TTS provider. Its two narration paths
were:

1. `app.js` used the browser Web Speech API. It selected from
   `speechSynthesis.getVoices()` by saved manual choice, the display name “Aria,”
   display-name quality terms, English locale, the browser default, or the first
   available voice. That dynamic behavior could change across devices.
2. `production/scripts/generate_narration.py` copied each story's 15 page strings
   into `narration.json`. It generated no audio and called no provider.

No provider credentials or provider configuration existed in the repository.
There was no one-file-per-page or one-file-per-story audio generation. No API
provider could silently substitute a voice because no provider API was called;
the browser path itself did silently fall through to other voices. No existing
narration file or manifest recorded a provider voice ID.

The pre-change inventory found 8 text-only `narration.json` files, 9 existing
story manifests, and 0 audio files. They were backed up before implementation.
All legacy narration is marked `needs_review`. Three arrays disagree with the
current preferred `speechText` source and were preserved rather than rewritten:

- Cora: Pages 4, 6, 14
- Pirate’s Curse: Page 12
- ThunderROARus: Pages 3, 15

## Result

- The locked config starts with no provider or approved voices.
- The allowlist is empty.
- Primary generation is the only default.
- Backup use requires `--use-backup`.
- Exact provider IDs are authoritative; display names are metadata only.
- Random, provider-default, unlisted, and silent fallback behavior is rejected.
- The provider-neutral command adapter sends exact text and the exact voice ID
  without a shell.
- Each generated page receives complete provenance, checksums, audio metadata,
  and a default listening status of `pending`.
- Existing audio can be reused only when text hash, provider, voice, model,
  settings, and checksum match.
- Final narration validation requires a human listening result of `passed`.
- Browser read-aloud no longer chooses by display name or fallback. It operates
  only for an exact approved `browser-speech-synthesis` voice URI; otherwise it
  reports `Locked narrator unavailable`.
- Service-worker cache version advanced from `nolan-library-v36` to
  `nolan-library-v37` and caches the locked JSON configuration.

No provider, primary voice, or backup voice was selected. No audition or story
audio was generated.

## Files changed

Modified:

- `README.txt`
- `app.js`
- `sw.js`
- `production/scripts/generate_narration.py`
- `production/scripts/validate_narration_voice.mjs`
- `production/scripts/validate_read_along.mjs`

Created:

- `config/narration-voices.json`
- `config/narration-candidates.example.json`
- `project-docs/NARRATION-VOICE-WORKFLOW.md`
- `production/scripts/narration_lock.py`
- `production/scripts/audition_narration_voices.py`
- `production/scripts/approve_narration_voices.py`
- `production/scripts/review_narration.py`
- `production/scripts/report_narration_discrepancies.py`
- `production/scripts/validate_narration.py`
- `production/scripts/tests/test_narration_lock.py`
- `production/reports/legacy-narration-inventory.json`
- `production/reports/NARRATION-VOICE-LOCKDOWN-REPORT.md`
- `production/reports/NARRATION-TEXT-DISCREPANCIES.md`
- `production/backups/narration-lockdown-20260729/` (preserved pre-change files)

No story JSON, legacy narration JSON, artwork, or completed image asset was
modified.

## Test commands and results

Python used:

```powershell
$py='C:\Users\sushi\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe'
```

Syntax:

```powershell
& $py -m py_compile production\scripts\narration_lock.py production\scripts\generate_narration.py production\scripts\audition_narration_voices.py production\scripts\approve_narration_voices.py production\scripts\review_narration.py production\scripts\validate_narration.py production\scripts\tests\test_narration_lock.py
node --check app.js
node --check sw.js
```

Result: passed.

Required lock-down tests:

```powershell
& $py -m unittest discover -s production\scripts\tests -p 'test_narration_lock.py' -v
```

Result: 15 tests passed. External TTS was mocked locally; no network or paid API
call occurred.

Existing production fixture tests:

```powershell
& $py production\scripts\run_fixture_tests.py
```

Result: passed.

Browser narration/read-along:

```powershell
node production\scripts\validate_narration_voice.mjs app.js
node production\scripts\validate_read_along.mjs app.js
```

Result: passed.

Existing app package check (the committed baseline predates 14 already-present
books and the already-changed Grave Digger record):

```powershell
node production\scripts\validate_app.mjs --app app.js --assets-root . --expected-increase 14 --expected-slugs grave-digger
```

Result: passed.

Patch integrity:

```powershell
git -c safe.directory='C:/Users/sushi/.codex/.chatgpt-projects/g-p-6a552630cfbc81919fcf9987ffcf3ad3/narration-voice-lock-worktree' diff --check
```

Result: passed.

Fail-closed probes:

```powershell
& $py production\scripts\generate_narration.py production\stories\blue-thunder-rainy-lantern-trail
& $py production\scripts\audition_narration_voices.py --candidates config\narration-candidates.example.json --output-dir voice-auditions
```

Results: generation stopped because no provider/primary is approved; audition
generation stopped because no provider is configured. Neither command created
audio.

## Audition command

After configuring a real provider command and a short candidate list:

```powershell
& $py production\scripts\audition_narration_voices.py `
  --candidates config\narration-candidates.json `
  --output-dir voice-auditions
```

Exact output directory:

`C:\Users\sushi\.codex\.chatgpt-projects\g-p-6a552630cfbc81919fcf9987ffcf3ad3\narration-voice-lock-worktree\voice-auditions`

## Approval command

After listening to every audition and choosing two exact IDs:

```powershell
& $py production\scripts\approve_narration_voices.py `
  --manifest voice-auditions\audition-manifest.json `
  --primary <EXACT_APPROVED_PRIMARY_VOICE_ID> `
  --backup <EXACT_APPROVED_BACKUP_VOICE_ID>
```

## Provider limitations and costs

No actual provider was present or selected, so there are no repository-specific
credentials, rates, quotas, or supported voice claims to report. The configured
external provider CLI owns authentication and may incur its normal charges when
auditions or story narration are generated. Those costs and limits must be checked
against the chosen provider and model before running the command.

Browser Speech Synthesis is device-dependent, exposes no standard audio export,
and does not guarantee the same voice URI across browsers. It is therefore locked
to an exact approved URI and cannot serve as a portable file-generation provider.

## Remaining manual steps

1. Choose a TTS provider and exact model.
2. Configure the command adapter without committing credentials.
3. Create a short explicit candidate list.
4. Generate auditions.
5. Listen to every audition.
6. Choose and approve one primary and one backup.
7. Resolve the three legacy text-source mismatches before generating those books.
8. Generate one story's narration with the primary.
9. Run technical validation.
10. Listen to all 15 page files and record the review.
11. Run final validation before packaging.

If an external file-based provider is chosen, playing those generated files in the
public app is a separate integration step; this change does not invent that path.
