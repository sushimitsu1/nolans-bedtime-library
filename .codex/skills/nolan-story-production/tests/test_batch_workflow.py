import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image

MODULE_PATH = Path(__file__).parents[1] / "scripts" / "batch_workflow.py"
SPEC = importlib.util.spec_from_file_location("batch_workflow", MODULE_PATH)
workflow = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(workflow)


class BatchWorkflowTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def make_package(self, slug, status="ready_to_publish"):
        story_dir = self.root / "production" / "stories" / slug
        asset_dir = self.root / "assets" / "books" / slug
        story_dir.mkdir(parents=True)
        asset_dir.mkdir(parents=True)
        pages = [{"pageNumber": n, "text": f"{slug} unique page {n}."} for n in range(1, 16)]
        texts = [page["text"] for page in pages]
        (story_dir / "story.json").write_text(json.dumps({"pages": pages}), encoding="utf-8")
        (story_dir / "narration.json").write_text(json.dumps(texts), encoding="utf-8")
        (story_dir / "package-status.json").write_text(json.dumps({"status": status}), encoding="utf-8")
        manifest = {"pages": [{"file": "cover.webp"}] + [
            {"file": f"page-{n:02d}.webp", "text": texts[n - 1], "pageBadge": n,
             "layout": "integrated_full_bleed", "fullBleed": True}
            for n in range(1, 16)]}
        (story_dir / "composition-manifest.json").write_text(json.dumps(manifest), encoding="utf-8")
        checks = {name: "passed" for name in workflow.REQUIRED_CHECKS}
        review = {"pages": [{"requiredSubjectBoxes": [{"label": "vehicle", "box": [1, 1, 10, 10]}],
                             "finalChecks": checks} for _ in range(15)]}
        (story_dir / "visual-review.json").write_text(json.dumps(review), encoding="utf-8")
        names = ["cover.webp"] + [f"page-{n:02d}.webp" for n in range(1, 16)]
        for index, name in enumerate(names):
            Image.new("RGB", workflow.FINAL_SIZE, (index, index * 3 % 256, index * 7 % 256)).save(
                asset_dir / name, format="WEBP", lossless=True, method=0)
        return story_dir

    def test_two_isolated_packages_do_not_allow_shared_changes(self):
        for slug in ("alpha", "bravo"):
            self.make_package(slug)
            allowed = [f"production/stories/{slug}/story.json", f"assets/books/{slug}/cover.webp"]
            self.assertEqual(workflow.isolation_errors(slug, allowed), [])
            self.assertEqual(workflow.isolation_errors(slug, ["app.js"]), ["app.js"])

    def test_ready_is_accepted_and_needs_review_is_excluded(self):
        self.make_package("ready")
        self.make_package("review", "needs_review")
        result = workflow.eligible_packages(self.root, ["ready", "review"])
        self.assertEqual(result, {"ready": ["ready"], "excluded": ["review"], "invalid": {}})

    def test_five_narration_arrays_come_from_story_text(self):
        slugs = [f"story-{number}" for number in range(5)]
        for slug in slugs:
            self.make_package(slug)
        arrays = workflow.narration_for(self.root, slugs)
        self.assertEqual(len(arrays), 5)
        for slug in slugs:
            self.assertEqual(arrays[slug], [f"{slug} unique page {n}." for n in range(1, 16)])

    def test_cache_version_changes_once(self):
        updated, before, after = workflow.bump_cache_text("const CACHE='nolan-library-v31';\nconst x=1;\n")
        self.assertEqual((before, after), ("31", "32"))
        self.assertEqual(updated.count("nolan-library-v32"), 1)
        self.assertNotIn("nolan-library-v31", updated)

    def test_temporary_contact_sheet_is_deleted(self):
        story_dir = self.make_package("contact")
        contact = story_dir / workflow.CONTACT_SHEET
        contact.write_bytes(b"temporary")
        self.assertEqual(workflow.cleanup_contact_sheet(story_dir), 1)
        self.assertFalse(contact.exists())

    def test_planner_selects_exactly_five_not_started(self):
        inventory = [{"slug": f"s{n}", "status": "not_started"} for n in range(6)]
        inventory.append({"slug": "published", "status": "published"})
        self.assertEqual(len(workflow.select_five(inventory)), 5)
        with self.assertRaises(ValueError):
            workflow.select_five(inventory, ["s0", "s1"])


if __name__ == "__main__":
    unittest.main()
