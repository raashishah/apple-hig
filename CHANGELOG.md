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
- Catalog `failWhen` / `passWhen` derived at load from `grammar.yaml` + pack Do/Don't (not title stubs, not Apply-in-host). Unpackaged rows stay stubs.
- Mechanical apply for dual-stack P0s: `scripts/apply-chrome.mjs` (`chrome.view-mode.icons`, `chrome.bars.system-materials`) on a web host and a Swift host; no kit or font rewrite. Other P0s still use `recipes.md`.
- Mechanical apply for remaining P0 IDs (`toolbar-budget`, `form.column-cohesion`, `fashion-glass`, `card-grid-home`) plus `nested-cards` on tmp copies of `chrome-antipatterns`. Filter-density and sidebar still use `recipes.md`. Committed fixtures stay dirty.
- Mechanical apply for remaining P1 IDs (`filter-density`, `sidebar.collapsible`). `apply-chrome.mjs` now owns every grammar ID. Committed fixtures stay dirty.
- Catalog apply: `scripts/apply-catalog.mjs` accounts packed topics whose `chromeIds` are clean after chrome P0. Pack-only pending topics stay pending. Eval on tmp `chrome-pass` and `chrome-antipatterns`.
- Catalog apply joins pack **Chrome gates** into topic `chromeIds` and accounts pack **Don't** backtick tokens (strip `scaleX(-1)`, map physical margin/padding, no kit). Prose-only Don'ts stay pending. Remaining is not a frozen integer.
- Catalog apply mechanically scans required-surface prose Don'ts (type, color, motion, a11y) and accounts a topic only when every Don't has a scanner. Host fonts stay. Optional packed Don'ts stay pending. Remaining is not a frozen integer.
- Optional widget affordances (`menu`, `picker`, `progress`, `search`, `notification`, `loading`, `feedback`, `onboarding`, `drag`) skip with `skipped-no-affordance` when the host has no matching widget. Search field ≠ Search nav link. `<select>` is a picker, not a menu. Presence without a Don't scanner still stays pending. `requiredIds` stay 12.
- Search Don't heuristics: hide-only-path, spinner-per-keystroke, search-as-settings-dump. chrome-pass search is already-compliant. Unfixable hide-only-path and command-dump stay pending. Do not invent a list. `requiredIds` stay 12.
- Settings and undo skip-unless affordances: hosts without a settings/preferences screen or undo chrome are `skipped-no-affordance`. A form is not Settings. Cancel is not Undo. Presence without a Don't scanner stays pending. Other foundations stay pending. `requiredIds` stay 12.
- Writing Don't heuristics: sarcastic errors that hide the fix, Title Case on long body help, rewritten Sign in/Pay/permission alerts. chrome-pass writing is already-compliant. Unfixable sarcasm and system-alert rewrites stay pending. Title Case help sentence-cases. Do not invent the next step or rewrite brand voice. Other foundations stay pending. `requiredIds` stay 12.
- Privacy Don't heuristics: dark-pattern Allow-only, pre-emptive camera/mic/location on marketing, rewritten or automated system permission/Pay/Sign in. chrome-pass privacy is already-compliant. Hidden Don't Allow unhides. Allow-only and marketing prompts stay pending. Do not invent a decline control or permission copy. Other foundations stay pending. `requiredIds` stay 12.

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
