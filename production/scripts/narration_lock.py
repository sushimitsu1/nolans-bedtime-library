from __future__ import annotations

import hashlib
import json
import os
import re
import struct
import subprocess
import tempfile
import wave
from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

from common import load_json, sha256, write_json


AUDITION_TEXT = (
    "“The rocky road was quiet beneath the evening sky. Ra the Ratata looked at his "
    "friends and gave a gentle smile. ‘We can fix it together,’ he said. Soon, the "
    "little vehicles were safe, the work was finished, and the moon shone softly above "
    "them. Good night, little builders.”"
)
CONFIG_RELATIVE_PATH = Path("config/narration-voices.json")
MANIFEST_NAME = "narration-manifest.json"
SUPPORTED_REVIEW_STATUSES = {"pending", "passed", "failed", "needs_regeneration"}
PROVENANCE_FIELDS = {
    "story_id",
    "page_number",
    "designation",
    "source_text",
    "source_text_sha256",
    "provider",
    "voice_id",
    "voice_display_name",
    "voice_role",
    "tts_model",
    "synthesis_settings",
    "output_filename",
    "file_sha256",
    "generated_at",
    "generation_status",
    "audio_metadata",
    "human_listening_review",
}


class NarrationError(RuntimeError):
    """Raised when locked narration rules are violated."""


def utc_now() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def text_sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def pending_review() -> dict:
    return {
        "status": "pending",
        "reviewed_by": None,
        "reviewed_at": None,
        "notes": None,
    }


def validate_locked_config(config: dict, *, require_approved: bool = False) -> list[str]:
    errors: list[str] = []
    if config.get("version") != 1:
        errors.append("narration voice config version must be 1")
    if config.get("selection_mode") != "locked":
        errors.append("selection_mode must be locked")
    for key in ("allow_provider_default", "allow_random_selection", "allow_unlisted_voice"):
        if config.get(key) is not False:
            errors.append(f"{key} must be false")
    allowed = config.get("allowed_voice_ids")
    if not isinstance(allowed, list) or any(not isinstance(value, str) or not value for value in allowed):
        errors.append("allowed_voice_ids must be an array of non-empty exact provider voice IDs")
        allowed = []
    if len(allowed) != len(set(allowed)):
        errors.append("allowed_voice_ids must not contain duplicates")
    for role in ("primary", "backup"):
        value = config.get(role)
        if not isinstance(value, dict):
            errors.append(f"{role} voice configuration is missing")
            continue
        status = value.get("status")
        voice_id = value.get("voice_id")
        if status not in {"not_selected", "approved"}:
            errors.append(f"{role} status must be not_selected or approved")
        if status == "approved":
            if not voice_id:
                errors.append(f"approved {role} voice is missing voice_id")
            elif voice_id not in allowed:
                errors.append(f"approved {role} voice_id is not allowlisted")
        elif voice_id is not None:
            errors.append(f"unapproved {role} voice_id must be null")
    primary_id = (config.get("primary") or {}).get("voice_id")
    backup_id = (config.get("backup") or {}).get("voice_id")
    if primary_id and backup_id and primary_id == backup_id:
        errors.append("primary and backup voice IDs must be different")
    if len(allowed) > 2:
        errors.append("allowlist may contain only the approved primary and backup IDs")
    if require_approved:
        if not config.get("provider"):
            errors.append("no narration provider is configured")
        if (config.get("primary") or {}).get("status") != "approved":
            errors.append("no approved primary narration voice has been selected")
    synthesis = config.get("synthesis")
    if not isinstance(synthesis, dict):
        errors.append("synthesis configuration is missing")
    return errors


def load_locked_config(path: str | Path, *, require_approved: bool = False) -> dict:
    config = load_json(path)
    errors = validate_locked_config(config, require_approved=require_approved)
    if errors:
        raise NarrationError("; ".join(errors))
    return config


def select_locked_voice(
    config: dict,
    *,
    use_backup: bool = False,
    requested_voice_id: str | None = None,
    environment: Mapping[str, str] | None = None,
) -> dict:
    errors = validate_locked_config(config, require_approved=True)
    if errors:
        raise NarrationError("; ".join(errors))
    role = "backup" if use_backup else "primary"
    selected = dict(config[role])
    if selected.get("status") != "approved" or not selected.get("voice_id"):
        raise NarrationError(f"no approved {role} narration voice has been selected")
    allowed = set(config["allowed_voice_ids"])
    environment = os.environ if environment is None else environment
    override = requested_voice_id or environment.get("NARRATION_VOICE_ID")
    if override:
        if override not in allowed:
            raise NarrationError("NARRATION_VOICE_ID is not in the locked allowlist")
        if override != selected["voice_id"]:
            if override == (config.get("backup") or {}).get("voice_id") and not use_backup:
                raise NarrationError("the backup voice requires the explicit --use-backup flag")
            raise NarrationError(f"voice override does not match the explicitly selected {role} voice")
    selected["role"] = role
    return selected


def resolve_story_source(story_path: str | Path) -> tuple[Path, dict, list[str], str]:
    source = Path(story_path)
    if source.is_dir():
        story_file = source / "story.json"
        requested_narration = None
    elif source.name == "narration.json":
        story_file = source.parent / "story.json"
        requested_narration = source
    else:
        story_file = source
        requested_narration = None
    if not story_file.is_file():
        raise NarrationError(f"story data not found: {story_file}")
    story = load_json(story_file)
    pages = story.get("pages", [])
    if len(pages) != 15 or [page.get("number") for page in pages] != list(range(1, 16)):
        raise NarrationError("story must contain pages 1-15 in order")
    uses_speech_text = any("speechText" in page for page in pages)
    field = "speechText" if uses_speech_text else "text"
    texts: list[str] = []
    for page in pages:
        text = page.get(field)
        if not isinstance(text, str) or not text:
            raise NarrationError(f"page {page.get('number')} has no exact {field} narration text")
        texts.append(text)
    narration_file = requested_narration or story_file.parent / "narration.json"
    if narration_file.is_file():
        narration = load_json(narration_file)
        if not isinstance(narration, list) or narration != texts:
            raise NarrationError(
                f"{narration_file} does not exactly match {story_file.name} pages[].{field}"
            )
    return story_file, story, texts, f"{story_file.name} pages[].{field}"


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.casefold()).strip("-")
    return cleaned[:48] or "voice"


def render_command(command: list[str], values: dict[str, str]) -> list[str]:
    if not command or any(not isinstance(part, str) or not part for part in command):
        raise NarrationError(
            "no provider adapter command is configured; set synthesis.adapter to "
            "'command' and provide a command array"
        )
    rendered = []
    for part in command:
        try:
            rendered.append(part.format_map(values))
        except KeyError as error:
            raise NarrationError(f"unknown provider command placeholder: {error.args[0]}") from error
    return rendered


class CommandTTSAdapter:
    """Runs an explicitly configured provider CLI without invoking a shell."""

    def __init__(self, synthesis: dict):
        if synthesis.get("adapter") != "command":
            raise NarrationError(
                "no supported TTS adapter is configured; this repository currently supports "
                "only an explicit command adapter"
            )
        self.command = synthesis.get("command", [])

    def synthesize(
        self,
        *,
        text: str,
        output_path: Path,
        provider: str,
        voice_id: str,
        model: str | None,
        settings: dict,
    ) -> None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory(prefix="nolan-narration-") as temporary:
            text_file = Path(temporary) / "exact-source.txt"
            text_file.write_text(text, encoding="utf-8")
            values = {
                "text_file": str(text_file),
                "output_file": str(output_path),
                "provider": provider,
                "voice_id": voice_id,
                "model": model or "",
                "settings_json": json.dumps(settings, separators=(",", ":"), ensure_ascii=False),
            }
            subprocess.run(render_command(self.command, values), check=True)
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise NarrationError("provider command did not create a non-empty audio file")


def make_adapter(config: dict):
    return CommandTTSAdapter(config["synthesis"])


def _read_previous_assets(manifest_path: Path) -> dict[int, dict]:
    if not manifest_path.is_file():
        return {}
    manifest = load_json(manifest_path)
    return {
        asset.get("page_number"): asset
        for asset in manifest.get("assets", [])
        if isinstance(asset, dict) and isinstance(asset.get("page_number"), int)
    }


def _can_reuse(
    record: dict | None,
    output_path: Path,
    *,
    source_hash: str,
    provider: str,
    voice_id: str,
    model: str | None,
    settings: dict,
) -> bool:
    return bool(
        record
        and output_path.is_file()
        and output_path.stat().st_size > 0
        and record.get("source_text_sha256") == source_hash
        and record.get("provider") == provider
        and record.get("voice_id") == voice_id
        and record.get("tts_model") == model
        and record.get("synthesis_settings") == settings
        and record.get("file_sha256") == sha256(output_path)
    )


def synthesize_story(
    story_path: str | Path,
    output_dir: str | Path,
    config_path: str | Path,
    *,
    use_backup: bool = False,
    overwrite: bool = False,
    requested_voice_id: str | None = None,
    environment: Mapping[str, str] | None = None,
    adapter=None,
) -> Path:
    config = load_locked_config(config_path, require_approved=True)
    voice = select_locked_voice(
        config,
        use_backup=use_backup,
        requested_voice_id=requested_voice_id,
        environment=environment,
    )
    story_file, story, texts, source_label = resolve_story_source(story_path)
    story_id = story.get("slug") or story_file.parent.name
    provider = config["provider"]
    synthesis = config["synthesis"]
    model = synthesis.get("model")
    settings = synthesis.get("settings") or {}
    output_format = str(synthesis.get("output_format") or "").lower().lstrip(".")
    if output_format not in {"mp3", "wav", "m4a", "ogg", "flac"}:
        raise NarrationError("synthesis.output_format must be mp3, wav, m4a, ogg, or flac")
    target_dir = Path(output_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    manifest_path = target_dir / MANIFEST_NAME
    previous = _read_previous_assets(manifest_path)
    provider_adapter = adapter or make_adapter(config)
    assets = []
    for number, text in enumerate(texts, 1):
        source_hash = text_sha256(text)
        filename = f"page-{number:02d}.{output_format}"
        output_path = target_dir / filename
        old = previous.get(number)
        if _can_reuse(
            old,
            output_path,
            source_hash=source_hash,
            provider=provider,
            voice_id=voice["voice_id"],
            model=model,
            settings=settings,
        ):
            record = dict(old)
            record["generation_status"] = "reused"
            assets.append(record)
            continue
        if output_path.exists() and not overwrite:
            raise NarrationError(
                f"{output_path} exists but does not match the locked voice/text provenance; "
                "use --overwrite to replace it"
            )
        provider_adapter.synthesize(
            text=text,
            output_path=output_path,
            provider=provider,
            voice_id=voice["voice_id"],
            model=model,
            settings=settings,
        )
        audio_metadata, audio_errors = probe_audio(output_path)
        if audio_errors:
            raise NarrationError("; ".join(audio_errors))
        assets.append(
            {
                "story_id": story_id,
                "page_number": number,
                "designation": f"page-{number:02d}",
                "source_text": text,
                "source_text_sha256": source_hash,
                "provider": provider,
                "voice_id": voice["voice_id"],
                "voice_display_name": voice.get("display_name"),
                "voice_role": voice["role"],
                "tts_model": model,
                "synthesis_settings": settings,
                "output_filename": filename,
                "file_sha256": sha256(output_path),
                "generated_at": utc_now(),
                "generation_status": "generated",
                "audio_metadata": audio_metadata,
                "human_listening_review": pending_review(),
            }
        )
    manifest = {
        "schema_version": 1,
        "story_id": story_id,
        "source": source_label,
        "provider": provider,
        "voice_id": voice["voice_id"],
        "voice_display_name": voice.get("display_name"),
        "voice_role": voice["role"],
        "backup_use_explicit": bool(use_backup),
        "tts_model": model,
        "synthesis_settings": settings,
        "assets": assets,
        "human_listening_review": pending_review(),
        "validation_status": "pending_listening_review",
        "updated_at": utc_now(),
    }
    write_json(manifest_path, manifest)
    final_manifest_path = story_file.parent / "manifest.json"
    final_manifest = load_json(final_manifest_path) if final_manifest_path.is_file() else {}
    try:
        narration_manifest_reference = manifest_path.resolve().relative_to(
            story_file.parent.resolve()
        ).as_posix()
    except ValueError:
        narration_manifest_reference = str(manifest_path.resolve())
    final_manifest.update(
        {
            "story_id": story_id,
            "narration": {
                "manifest": narration_manifest_reference,
                "provider": provider,
                "voice_id": voice["voice_id"],
                "voice_display_name": voice.get("display_name"),
                "voice_role": voice["role"],
                "human_listening_review": "pending",
            },
        }
    )
    write_json(final_manifest_path, final_manifest)
    return manifest_path


def load_candidates(path: str | Path) -> dict:
    candidate_data = load_json(path)
    provider = candidate_data.get("provider")
    candidates = candidate_data.get("candidates")
    if not isinstance(provider, str) or not provider:
        raise NarrationError("candidate list must name an exact provider")
    if not isinstance(candidates, list) or not 2 <= len(candidates) <= 8:
        raise NarrationError("candidate list must explicitly contain between 2 and 8 voices")
    seen = set()
    for candidate in candidates:
        if not isinstance(candidate, dict):
            raise NarrationError("each candidate must be an object")
        voice_id = candidate.get("voice_id")
        if not isinstance(voice_id, str) or not voice_id:
            raise NarrationError("every candidate must have an exact non-empty voice_id")
        if voice_id in seen:
            raise NarrationError("candidate voice IDs must be unique")
        seen.add(voice_id)
        if not isinstance(candidate.get("display_name"), str) or not candidate["display_name"]:
            raise NarrationError("every candidate must have a display_name")
    return candidate_data


def generate_auditions(
    candidates_path: str | Path,
    output_dir: str | Path,
    config_path: str | Path,
    *,
    overwrite: bool = False,
    adapter=None,
) -> Path:
    config = load_locked_config(config_path)
    candidate_data = load_candidates(candidates_path)
    provider = config.get("provider")
    if not provider:
        raise NarrationError("configure provider before generating auditions")
    if candidate_data["provider"] != provider:
        raise NarrationError("candidate provider does not match locked narration provider")
    synthesis = config["synthesis"]
    model = synthesis.get("model")
    settings = synthesis.get("settings") or {}
    output_format = str(synthesis.get("output_format") or "").lower().lstrip(".")
    target_dir = Path(output_dir)
    manifest_path = target_dir / "audition-manifest.json"
    expected = []
    for index, candidate in enumerate(candidate_data["candidates"], 1):
        expected.append(
            target_dir
            / f"candidate-{index:02d}-{safe_name(candidate['display_name'])}.{output_format}"
        )
    collisions = [path for path in [manifest_path, *expected] if path.exists()]
    if collisions and not overwrite:
        raise NarrationError(
            "audition output already exists; use --overwrite to replace this explicit candidate set"
        )
    target_dir.mkdir(parents=True, exist_ok=True)
    provider_adapter = adapter or make_adapter(config)
    records = []
    for candidate, output_path in zip(candidate_data["candidates"], expected):
        provider_adapter.synthesize(
            text=AUDITION_TEXT,
            output_path=output_path,
            provider=provider,
            voice_id=candidate["voice_id"],
            model=model,
            settings=settings,
        )
        audio_metadata, audio_errors = probe_audio(output_path)
        if audio_errors:
            raise NarrationError("; ".join(audio_errors))
        records.append(
            {
                "provider": provider,
                "voice_id": candidate["voice_id"],
                "display_name": candidate["display_name"],
                "model": model,
                "settings": settings,
                "generated_at": utc_now(),
                "output_filename": output_path.name,
                "file_sha256": sha256(output_path),
                "audio_metadata": audio_metadata,
                "source_text_sha256": text_sha256(AUDITION_TEXT),
                "generation_status": "generated",
                "approval_status": "not_approved",
            }
        )
    manifest = {
        "schema_version": 1,
        "provider": provider,
        "source_text": AUDITION_TEXT,
        "source_text_sha256": text_sha256(AUDITION_TEXT),
        "model": model,
        "settings": settings,
        "generated_at": utc_now(),
        "candidates": records,
        "approval_status": "human_selection_required",
    }
    write_json(manifest_path, manifest)
    return manifest_path


def approve_voices(
    config_path: str | Path,
    audition_manifest_path: str | Path,
    primary_id: str,
    backup_id: str,
    *,
    replace: bool = False,
) -> dict:
    if primary_id == backup_id:
        raise NarrationError("primary and backup voice IDs must be different")
    config_path = Path(config_path)
    config = load_locked_config(config_path)
    audition_path = Path(audition_manifest_path)
    audition = load_json(audition_path)
    if (
        audition.get("source_text") != AUDITION_TEXT
        or audition.get("source_text_sha256") != text_sha256(AUDITION_TEXT)
    ):
        raise NarrationError("audition manifest does not contain the exact locked audition text")
    synthesis = config.get("synthesis") or {}
    if audition.get("model") != synthesis.get("model"):
        raise NarrationError("audition model does not match the configured synthesis model")
    if audition.get("settings") != (synthesis.get("settings") or {}):
        raise NarrationError("audition settings do not match the configured synthesis settings")
    candidates = {
        candidate.get("voice_id"): candidate
        for candidate in audition.get("candidates", [])
        if isinstance(candidate, dict)
    }
    missing = [voice_id for voice_id in (primary_id, backup_id) if voice_id not in candidates]
    if missing:
        raise NarrationError(f"voice ID was not auditioned: {', '.join(missing)}")
    if audition.get("provider") in {None, "", "default", "unknown"}:
        raise NarrationError("audition manifest has no exact provider")
    for voice_id in (primary_id, backup_id):
        candidate = candidates[voice_id]
        if candidate.get("generation_status") != "generated":
            raise NarrationError(f"audition was not generated successfully for {voice_id}")
        output = audition_path.parent / candidate.get("output_filename", "")
        if not output.is_file() or sha256(output) != candidate.get("file_sha256"):
            raise NarrationError(f"audition file/checksum is invalid for {voice_id}")
    old_ids = (
        (config.get("primary") or {}).get("voice_id"),
        (config.get("backup") or {}).get("voice_id"),
    )
    new_ids = (primary_id, backup_id)
    already_approved = any(
        (config.get(role) or {}).get("status") == "approved" for role in ("primary", "backup")
    )
    if already_approved and old_ids != new_ids and not replace:
        raise NarrationError("approved voices already exist; use --replace to change them")
    provider = audition["provider"]
    if config.get("provider") not in {None, provider}:
        raise NarrationError("audition provider does not match configured provider")
    config["provider"] = provider
    config["primary"] = {
        "voice_id": primary_id,
        "display_name": candidates[primary_id].get("display_name"),
        "status": "approved",
    }
    config["backup"] = {
        "voice_id": backup_id,
        "display_name": candidates[backup_id].get("display_name"),
        "status": "approved",
    }
    config["allowed_voice_ids"] = [primary_id, backup_id]
    config["approval"] = {
        "source_audition_manifest": str(audition_path.resolve()),
        "approved_at": utc_now(),
        "selection": "manual_human_listening",
    }
    errors = validate_locked_config(config, require_approved=True)
    if errors:
        raise NarrationError("; ".join(errors))
    write_json(config_path, config)
    for candidate in audition["candidates"]:
        if candidate.get("voice_id") == primary_id:
            candidate["approval_status"] = "approved_primary"
        elif candidate.get("voice_id") == backup_id:
            candidate["approval_status"] = "approved_backup"
        else:
            candidate["approval_status"] = "not_approved"
    audition["approval_status"] = "manually_approved"
    audition["approved_at"] = utc_now()
    write_json(audition_path, audition)
    return config


def probe_audio(path: Path) -> tuple[dict, list[str]]:
    errors: list[str] = []
    metadata = {"format": path.suffix.lower().lstrip("."), "bytes": path.stat().st_size}
    if path.stat().st_size < 32:
        errors.append(f"{path.name}: audio is empty or near-empty")
        return metadata, errors
    suffix = path.suffix.lower()
    if suffix == ".wav":
        try:
            with wave.open(str(path), "rb") as handle:
                channels = handle.getnchannels()
                sample_width = handle.getsampwidth()
                frame_rate = handle.getframerate()
                frame_count = handle.getnframes()
                duration = frame_count / frame_rate if frame_rate else 0
                raw = handle.readframes(frame_count)
            metadata.update(
                {
                    "channels": channels,
                    "sample_width_bytes": sample_width,
                    "sample_rate_hz": frame_rate,
                    "duration_seconds": round(duration, 3),
                }
            )
            if duration <= 0.1:
                errors.append(f"{path.name}: invalid audio duration")
            if sample_width == 2 and raw:
                count = len(raw) // 2
                samples = struct.unpack(f"<{count}h", raw[: count * 2])
                clipping_ratio = sum(abs(value) >= 32760 for value in samples) / len(samples)
                silence_ratio = sum(abs(value) <= 32 for value in samples) / len(samples)
                metadata["clipping_ratio"] = round(clipping_ratio, 6)
                metadata["silence_ratio"] = round(silence_ratio, 6)
                if clipping_ratio > 0.1:
                    errors.append(f"{path.name}: severe clipping detected")
                if duration > 1 and silence_ratio > 0.98:
                    errors.append(f"{path.name}: unusually long silence detected")
        except (wave.Error, EOFError) as error:
            errors.append(f"{path.name}: invalid WAV audio ({error})")
    elif suffix == ".mp3":
        header = path.read_bytes()[:3]
        if header != b"ID3" and not (len(header) >= 2 and header[0] == 0xFF and header[1] & 0xE0 == 0xE0):
            errors.append(f"{path.name}: invalid MP3 header")
    elif suffix == ".flac":
        if path.read_bytes()[:4] != b"fLaC":
            errors.append(f"{path.name}: invalid FLAC header")
    elif suffix == ".ogg":
        if path.read_bytes()[:4] != b"OggS":
            errors.append(f"{path.name}: invalid OGG header")
    elif suffix == ".m4a":
        if b"ftyp" not in path.read_bytes()[:32]:
            errors.append(f"{path.name}: invalid M4A header")
    else:
        errors.append(f"{path.name}: unsupported audio format")
    return metadata, errors


def validate_narration_manifest(
    manifest_path: str | Path,
    config_path: str | Path,
    story_path: str | Path,
    *,
    require_human_review: bool = True,
) -> list[str]:
    errors: list[str] = []
    manifest_path = Path(manifest_path)
    try:
        config = load_locked_config(config_path, require_approved=True)
    except (NarrationError, OSError, json.JSONDecodeError) as error:
        return [f"locked voice configuration invalid: {error}"]
    try:
        _, story, texts, _ = resolve_story_source(story_path)
    except (NarrationError, OSError, json.JSONDecodeError) as error:
        return [f"story narration source invalid: {error}"]
    try:
        manifest = load_json(manifest_path)
    except (OSError, json.JSONDecodeError) as error:
        return [f"narration manifest missing or invalid: {error}"]
    story_id = story.get("slug") or Path(story_path).parent.name
    if manifest.get("story_id") != story_id:
        errors.append("narration manifest story_id does not match story")
    provider = manifest.get("provider")
    if not provider or provider in {"default", "unknown"}:
        errors.append("provider-default or unknown narration provider is prohibited")
    elif provider != config.get("provider"):
        errors.append("narration provider does not match locked configuration")
    voice_id = manifest.get("voice_id")
    allowed = set(config.get("allowed_voice_ids", []))
    if not voice_id:
        errors.append("narration manifest voice_id is missing")
    elif voice_id not in allowed:
        errors.append("narration manifest voice_id is not allowlisted")
    role = manifest.get("voice_role")
    expected_id = (config.get(role) or {}).get("voice_id") if role in {"primary", "backup"} else None
    if role not in {"primary", "backup"}:
        errors.append("narration voice role must be primary or explicitly authorized backup")
    elif voice_id != expected_id:
        errors.append("narration voice_id does not match its approved role")
    if role == "backup" and manifest.get("backup_use_explicit") is not True:
        errors.append("backup narration was not explicitly authorized")
    assets = manifest.get("assets")
    if not isinstance(assets, list) or len(assets) != len(texts):
        errors.append(f"expected {len(texts)} narration assets")
        assets = assets if isinstance(assets, list) else []
    seen_voice_ids = set()
    seen_pages = set()
    manifest_dir = manifest_path.parent
    for index, asset in enumerate(assets, 1):
        if not isinstance(asset, dict):
            errors.append(f"narration asset {index} is not an object")
            continue
        missing = sorted(field for field in PROVENANCE_FIELDS if field not in asset)
        if missing:
            errors.append(f"narration asset {index} has incomplete provenance: {', '.join(missing)}")
        page_number = asset.get("page_number")
        if page_number in seen_pages:
            errors.append(f"duplicate narration page number: {page_number}")
        seen_pages.add(page_number)
        if page_number != index:
            errors.append(f"narration asset {index} has incorrect page number")
        expected_text = texts[index - 1] if index <= len(texts) else None
        if asset.get("source_text") != expected_text:
            errors.append(f"narration asset {index} exact source text does not match story")
        if expected_text is not None and asset.get("source_text_sha256") != text_sha256(expected_text):
            errors.append(f"narration asset {index} source-text hash does not match current story")
        asset_voice = asset.get("voice_id")
        if asset_voice:
            seen_voice_ids.add(asset_voice)
        if asset_voice != voice_id:
            errors.append(f"narration asset {index} voice_id does not match story manifest")
        if asset.get("provider") != provider:
            errors.append(f"narration asset {index} provider does not match story manifest")
        if asset.get("voice_role") != role:
            errors.append(f"narration asset {index} voice role does not match story manifest")
        filename = asset.get("output_filename")
        audio_path = manifest_dir / filename if isinstance(filename, str) else None
        if not audio_path or not audio_path.is_file():
            errors.append(f"narration asset {index} audio file is missing")
            continue
        if audio_path.stat().st_size == 0:
            errors.append(f"narration asset {index} audio file is empty")
            continue
        actual_checksum = sha256(audio_path)
        if asset.get("file_sha256") != actual_checksum:
            errors.append(f"narration asset {index} file checksum does not match manifest")
        actual_metadata, audio_errors = probe_audio(audio_path)
        errors.extend(audio_errors)
        recorded_metadata = asset.get("audio_metadata")
        if recorded_metadata is not None and recorded_metadata != actual_metadata:
            errors.append(f"narration asset {index} audio metadata does not match file")
        duration = actual_metadata.get("duration_seconds")
        if duration and expected_text:
            words = len(re.findall(r"\b[\w’'-]+\b", expected_text))
            words_per_minute = words / duration * 60
            if words_per_minute < 45 or words_per_minute > 260:
                errors.append(f"narration asset {index} has a major text-duration mismatch")
        review = asset.get("human_listening_review")
        if require_human_review and (
            not isinstance(review, dict) or review.get("status") != "passed"
        ):
            errors.append(f"narration asset {index} has not passed human listening review")
    if len(seen_voice_ids) > 1:
        errors.append("different voice IDs appear within one story")
    if seen_voice_ids - allowed:
        errors.append("unapproved voice IDs appear within one story")
    overall_review = manifest.get("human_listening_review")
    if require_human_review and (
        not isinstance(overall_review, dict) or overall_review.get("status") != "passed"
    ):
        errors.append("story narration has not passed human listening review")
    return errors


def record_review(
    manifest_path: str | Path,
    config_path: str | Path,
    story_path: str | Path,
    *,
    status: str,
    reviewer: str | None,
    notes: str | None,
) -> dict:
    if status not in SUPPORTED_REVIEW_STATUSES:
        raise NarrationError(f"unsupported review status: {status}")
    if status != "pending" and not reviewer:
        raise NarrationError("reviewer is required for a completed listening review")
    if status == "passed":
        technical_errors = validate_narration_manifest(
            manifest_path, config_path, story_path, require_human_review=False
        )
        if technical_errors:
            raise NarrationError(
                "technical narration validation failed: " + "; ".join(technical_errors)
            )
    manifest_path = Path(manifest_path)
    manifest = load_json(manifest_path)
    review = {
        "status": status,
        "reviewed_by": reviewer if status != "pending" else None,
        "reviewed_at": utc_now() if status != "pending" else None,
        "notes": notes,
    }
    manifest["human_listening_review"] = dict(review)
    for asset in manifest.get("assets", []):
        asset["human_listening_review"] = dict(review)
    manifest["validation_status"] = "fully_approved" if status == "passed" else status
    manifest["updated_at"] = utc_now()
    write_json(manifest_path, manifest)
    story_file, _, _, _ = resolve_story_source(story_path)
    final_manifest_path = story_file.parent / "manifest.json"
    if final_manifest_path.is_file():
        final_manifest = load_json(final_manifest_path)
        if isinstance(final_manifest.get("narration"), dict):
            final_manifest["narration"]["human_listening_review"] = status
            write_json(final_manifest_path, final_manifest)
    return manifest
