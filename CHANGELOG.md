# Changelog

## 0.4.1 — 2026-09-21

Mechanical chrome FAIL gate + recipes so `/hig` is model-proof.

- `scripts/check-chrome.mjs` scans host UI source; P0 hits block `HIG_CHROME` PASS
- Recipes: `knowledge/chrome/recipes.md`
- New FAIL IDs: `chrome.materials.fashion-glass`, `chrome.layout.card-grid-home`, `chrome.ive.nested-cards`
- Round 1 apply = 12 required surfaces from `surfaces.yaml`; optional packs wait until core P0 is clean
- Product + unspecified fonts stay with the host (no hardcoded SF Pro)
- `chrome.list-browser.filter-density` is a required grammar class
- Eval: `eval/run-check-chrome.mjs` plus pass/fail fixtures
- Later catalog goal-loop plan: `docs/plans/2026-09-21-hig-catalog-goal-agent.md` (additive; does not replace `requiredIds`)
- Catalog inventory: `knowledge/catalog.yaml` from Apple's live index (`scripts/sync-hig-catalog.mjs`). Round 1 apply still 12 `requiredIds`. Eval: `eval/run-catalog.mjs`
- Catalog goal loop after chrome P0: `scripts/plan-catalog.mjs` writes `.hig/catalog-status.yaml`. Wave 0 stays `requiredIds`. Then apply remaining packed applicable topics until `remaining` is 0. Brand app-shell rows are `n/a-register`. Watch/TV/Vision skip on web. Pattern `affordance` skips when the host has no matching widget. Same chrome P0 FAILs proven on a web host and a Swift host without naming those stacks in the rule.

## Unreleased

- Live HIG URL hygiene: Toolbars (not `/navigation` or `/navigation-bars`), Gestures, Entering data; ban `/app-intents`
- Glass-safe chrome: `chrome.bars.system-materials` FAILs custom opaque bar fills; do not FAIL missing opaque nav
- Surface gates: optional ids use flat `gate`; preflight `platform` + `capabilities`; skip ≠ synthesizer drop; tech stays off `requiredIds`
- Platform gates: iPad-only `UIDeviceFamily` `[2]`; SwiftUI Mac via `.macOS(`; `multi` / `platform_secondary` include desktop for `mac-chrome`
- Wire Getting Started, foundations, patterns, inputs, system, and tech packs as gated surfaces (`requiredIds` still 12)
- One Siri worker (compose App Shortcuts); sheets compose action sheets; PassKit → wallet not Apple Pay; Control Widget gates Control Center; Pencil is iPad AND pencil
- iPhone Duo Getting started is gated (`duo` / `capability:duo`); current iPhone skips it

## 0.4.0 — 2026-09-12

`/hig` is a **framework-agnostic swarm**, not a React-only implementer.

- Detect SwiftUI / UIKit / web / React / other UI; fail only when there is no UI
- Parallel surface agents (layout, type, color, spacing, motion, controls, nav, lists/split, sheets, forms, a11y)
- Optional `hig-react` mapping skill — no component injection
- Apple canon (`knowledge/canon.md`) + `surfaces.yaml`
- Install via `npx skills add raashishah/apple-hig -g -y`

## 0.3.2 — 2026-07-25

Rename to **upgrade** (not update) and clarify README.

- `/hig upgrade` + skill `hig-upgrade` (say **HIG upgrade**)
- `scripts/upgrade-check.sh` (was update-check) + `scripts/upgrade.sh`
- README: no auto-upgrade; install shapes; how the skill “learns”
- Removes legacy `hig-update` symlink on `./setup`

## 0.3.1 — 2026-07-25

gstack-style self-upgrade (first ship; commands used the word “update”).

- Check/upgrade scripts, `VERSION`, `./setup` dual skill links

## 0.3.0 — 2026-07-25

Public packaging release for feedback.

- Cursor plugin layout (`.cursor-plugin/plugin.json`) ready for marketplace / Git install
- `./setup` installs `/hig` into `~/.cursor/skills/hig`
- Chrome grammar dry eval + brand-veto / unsupported-stack dry evals
- Proof notes from Pink Depot dogfood + admissionsdemo portable run
- Honest gaps list (next chrome FAIL candidates) for early testers

## 0.2.0

- Bare `/hig` = design + implement from existing requirements
- Pattern packs + brand veto + materials arbitration
- Chrome grammar v1 (`chrome.view-mode.icons`, toolbar budget, filter density, form column cohesion, sidebar collapse)
