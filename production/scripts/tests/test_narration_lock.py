from __future__ import annotations

import copy
import json
import math
import struct
import sys
import tempfile
import unittest
import wave
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parents[1]
if str(SCRIPT_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPT_DIR))

from common import load_json, sha256, write_json
from narration_lock import (
    AUDITION_TEXT,
    NarrationError,
    approve_voices,
    generate_auditions,
    pending_review,
    record_review,
    select_locked_voice,
    synthesize_story,
    text_sha256,
    validate_locked_config,
    validate_narration_manifest,
)


class FakeTTSAdapter:
    def __init__(self):
        self.calls: list[dict] = []

    def synthesize(self, **kwargs) -> None:
        self.calls.append(dict(kwargs))
        output_path = Path(kwargs["output_path"])
        output_path.parent.mkdir(parents=True, exist_ok=True)
        frame_rate = 8000
        duration_seconds = 2
        frames = []
        for index in range(frame_rate * duration_seconds):
            value = int(2200 * math.sin(2 * math.pi * 220 * index / frame_rate))
            frames.append(struct.pack("<h", value))
        with wave.open(str(output_path), "wb") as handle:
            handle.setnchannels(1)
            handle.setsampwidth(2)
            handle.setframerate(frame_rate)
            handle.writeframes(b"".join(frames))


def make_story() -> dict:
    return {
        "title": "Test Story",
        "slug": "test-story",
        "pages": [
            {
                "number": number,
                "text": f"Calm little trucks finish task number {number} together.",
            }
            for number in range(1, 16)
        ],
    }


def make_config(*, approved: bool = True) -> dict:
    config = {
        "version": 1,
        "provider": "fake-provider",
        "primary": {
            "voice_id": "voice-primary" if approved else None,
            "display_name": "Primary Human" if approved else None,
            "status": "approved" if approved else "not_selected",
        },
        "backup": {
            "voice_id": "voice-backup" if approved else None,
            "display_name": "Backup Human" if approved else None,
            "status": "approved" if approved else "not_selected",
        },
        "allowed_voice_ids": ["voice-primary", "voice-backup"] if approved else [],
        "selection_mode": "locked",
        "allow_provider_default": False,
        "allow_random_selection": False,
        "allow_unlisted_voice": False,
        "synthesis": {
            "adapter": None,
            "command": [],
            "model": "fake-model",
            "settings": {"pace": "calm"},
            "output_format": "wav",
        },
    }
    return config


class NarrationLockTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory(prefix="nolan-narration-tests-")
        self.root = Path(self.temporary.name)
        self.story_dir = self.root / "story"
        self.story_dir.mkdir()
        self.story_path = self.story_dir / "story.json"
        self.narration_path = self.story_dir / "narration.json"
        self.config_path = self.root / "narration-voices.json"
        self.output_dir = self.story_dir / "narration-audio"
        story = make_story()
        write_json(self.story_path, story)
        write_json(self.narration_path, [page["text"] for page in story["pages"]])
        write_json(self.config_path, make_config())

    def tearDown(self) -> None:
        self.temporary.cleanup()

    def generate(self, *, use_backup: bool = False):
        adapter = FakeTTSAdapter()
        manifest = synthesize_story(
            self.story_dir,
            self.output_dir,
            self.config_path,
            use_backup=use_backup,
            environment={},
            adapter=adapter,
        )
        return adapter, manifest

    def make_audition_manifest(self, ids=("voice-primary", "voice-backup")) -> Path:
        audition_dir = self.root / "voice-auditions"
        audition_dir.mkdir(exist_ok=True)
        adapter = FakeTTSAdapter()
        candidates_path = self.root / "candidates.json"
        write_json(
            candidates_path,
            {
                "provider": "fake-provider",
                "candidates": [
                    {"voice_id": voice_id, "display_name": f"Name {index}"}
                    for index, voice_id in enumerate(ids, 1)
                ],
            },
        )
        return generate_auditions(
            candidates_path,
            audition_dir,
            self.config_path,
            adapter=adapter,
        )

    def test_01_generation_fails_without_approved_primary(self):
        write_json(self.config_path, make_config(approved=False))
        with self.assertRaisesRegex(NarrationError, "no approved primary"):
            synthesize_story(
                self.story_dir,
                self.output_dir,
                self.config_path,
                environment={},
                adapter=FakeTTSAdapter(),
            )

    def test_02_generation_rejects_unallowlisted_voice(self):
        config = load_json(self.config_path)
        with self.assertRaisesRegex(NarrationError, "not in the locked allowlist"):
            select_locked_voice(
                config,
                requested_voice_id="intruder-voice",
                environment={},
            )

    def test_03_generation_uses_exact_primary_voice_id(self):
        adapter, manifest_path = self.generate()
        self.assertEqual(15, len(adapter.calls))
        self.assertEqual({"voice-primary"}, {call["voice_id"] for call in adapter.calls})
        manifest = load_json(manifest_path)
        self.assertEqual("voice-primary", manifest["voice_id"])
        self.assertEqual(
            {"voice-primary"}, {asset["voice_id"] for asset in manifest["assets"]}
        )
        self.assertEqual("voice-primary", load_json(self.story_dir / "manifest.json")["narration"]["voice_id"])

    def test_04_backup_is_used_only_when_explicit(self):
        primary_adapter, _ = self.generate()
        self.assertEqual({"voice-primary"}, {call["voice_id"] for call in primary_adapter.calls})
        backup_dir = self.story_dir / "backup-audio"
        backup_adapter = FakeTTSAdapter()
        manifest_path = synthesize_story(
            self.story_dir,
            backup_dir,
            self.config_path,
            use_backup=True,
            environment={},
            adapter=backup_adapter,
        )
        self.assertEqual({"voice-backup"}, {call["voice_id"] for call in backup_adapter.calls})
        self.assertTrue(load_json(manifest_path)["backup_use_explicit"])
        with self.assertRaisesRegex(NarrationError, "explicit --use-backup"):
            select_locked_voice(
                load_json(self.config_path),
                requested_voice_id="voice-backup",
                environment={},
            )

    def test_05_random_or_provider_default_selection_is_impossible(self):
        config = make_config()
        config["allow_random_selection"] = True
        config["allow_provider_default"] = True
        errors = validate_locked_config(config, require_approved=True)
        self.assertTrue(any("allow_random_selection must be false" in error for error in errors))
        self.assertTrue(any("allow_provider_default must be false" in error for error in errors))

    def test_06_unknown_environment_override_is_rejected(self):
        with self.assertRaisesRegex(NarrationError, "not in the locked allowlist"):
            select_locked_voice(
                load_json(self.config_path),
                environment={"NARRATION_VOICE_ID": "unknown-environment-voice"},
            )

    def test_07_approval_rejects_unauditioned_candidate(self):
        manifest_path = self.make_audition_manifest()
        write_json(self.config_path, make_config(approved=False))
        with self.assertRaisesRegex(NarrationError, "was not auditioned"):
            approve_voices(
                self.config_path,
                manifest_path,
                "voice-primary",
                "not-a-candidate",
            )

    def test_08_approval_rejects_identical_primary_and_backup(self):
        manifest_path = self.make_audition_manifest()
        write_json(self.config_path, make_config(approved=False))
        with self.assertRaisesRegex(NarrationError, "must be different"):
            approve_voices(
                self.config_path,
                manifest_path,
                "voice-primary",
                "voice-primary",
            )

    def test_09_approved_voices_require_explicit_replacement(self):
        manifest_path = self.make_audition_manifest()
        with self.assertRaisesRegex(NarrationError, "use --replace"):
            approve_voices(
                self.config_path,
                manifest_path,
                "voice-backup",
                "voice-primary",
            )
        config = approve_voices(
            self.config_path,
            manifest_path,
            "voice-backup",
            "voice-primary",
            replace=True,
        )
        self.assertEqual("voice-backup", config["primary"]["voice_id"])

    def test_10_source_text_change_invalidates_existing_narration(self):
        _, manifest_path = self.generate()
        story = load_json(self.story_path)
        story["pages"][0]["text"] = "The approved story text changed completely here."
        write_json(self.story_path, story)
        write_json(self.narration_path, [page["text"] for page in story["pages"]])
        errors = validate_narration_manifest(
            manifest_path,
            self.config_path,
            self.story_dir,
            require_human_review=False,
        )
        self.assertTrue(any("source text" in error or "source-text hash" in error for error in errors))

    def test_11_validation_detects_mixed_and_missing_voice_ids(self):
        _, manifest_path = self.generate()
        manifest = load_json(manifest_path)
        manifest["assets"][0].pop("voice_id")
        manifest["assets"][1]["voice_id"] = "voice-backup"
        write_json(manifest_path, manifest)
        errors = validate_narration_manifest(
            manifest_path,
            self.config_path,
            self.story_dir,
            require_human_review=False,
        )
        self.assertTrue(any("incomplete provenance" in error for error in errors))
        self.assertTrue(any("different voice IDs" in error for error in errors))

    def test_12_human_review_defaults_to_pending(self):
        _, manifest_path = self.generate()
        manifest = load_json(manifest_path)
        self.assertEqual("pending", manifest["human_listening_review"]["status"])
        self.assertEqual(
            {"pending"},
            {
                asset["human_listening_review"]["status"]
                for asset in manifest["assets"]
            },
        )

    def test_13_final_approval_is_blocked_while_review_pending_or_failed(self):
        _, manifest_path = self.generate()
        pending_errors = validate_narration_manifest(
            manifest_path,
            self.config_path,
            self.story_dir,
            require_human_review=True,
        )
        self.assertTrue(any("has not passed human listening review" in error for error in pending_errors))
        manifest = load_json(manifest_path)
        failed_review = {
            "status": "failed",
            "reviewed_by": "Reviewer",
            "reviewed_at": "2026-07-29T00:00:00Z",
            "notes": "Test failure",
        }
        manifest["human_listening_review"] = copy.deepcopy(failed_review)
        for asset in manifest["assets"]:
            asset["human_listening_review"] = copy.deepcopy(failed_review)
        write_json(manifest_path, manifest)
        failed_errors = validate_narration_manifest(
            manifest_path,
            self.config_path,
            self.story_dir,
            require_human_review=True,
        )
        self.assertTrue(any("has not passed human listening review" in error for error in failed_errors))

    def test_14_auditions_use_exact_text_ids_and_require_overwrite(self):
        manifest_path = self.make_audition_manifest()
        manifest = load_json(manifest_path)
        self.assertEqual(AUDITION_TEXT, manifest["source_text"])
        self.assertEqual(text_sha256(AUDITION_TEXT), manifest["source_text_sha256"])
        self.assertEqual(
            ["voice-primary", "voice-backup"],
            [candidate["voice_id"] for candidate in manifest["candidates"]],
        )
        self.assertEqual(
            {"not_approved"},
            {candidate["approval_status"] for candidate in manifest["candidates"]},
        )
        candidates_path = self.root / "candidates.json"
        with self.assertRaisesRegex(NarrationError, "already exists"):
            generate_auditions(
                candidates_path,
                manifest_path.parent,
                self.config_path,
                adapter=FakeTTSAdapter(),
            )

    def test_15_passed_review_can_receive_final_approval(self):
        _, manifest_path = self.generate()
        reviewed = record_review(
            manifest_path,
            self.config_path,
            self.story_dir,
            status="passed",
            reviewer="Jay",
            notes="Listened to all pages.",
        )
        self.assertEqual("fully_approved", reviewed["validation_status"])
        self.assertEqual(
            [],
            validate_narration_manifest(
                manifest_path,
                self.config_path,
                self.story_dir,
                require_human_review=True,
            ),
        )


if __name__ == "__main__":
    unittest.main()
