# Chrome grammar

Single source of truth for solved Apple chrome FAIL codes.

1. Load `grammar.yaml` before implementing or reviewing product chrome.
2. Packs only cite rule IDs under `## Chrome gates`.
3. Review must emit `structure:<id>` when a rule fails.
4. Brand veto blocks spacing mutation, never structure FAIL reports.
5. After apply, `scripts/check-chrome.mjs` must report no P0. Mechanical dual-stack P0s: `scripts/apply-chrome.mjs`. Other recipes live in `recipes.md`.

See `review-rubric.md` for report shape.
