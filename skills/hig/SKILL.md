---
name: hig
description: >-
  Apply Apple Human Interface Guidelines 1:1 to the current project with a swarm
  of surface agents (layout, type, color, spacing, motion, controls, navigation,
  lists/split, sheets, forms, accessibility) until the UI feels Apple-native.
  Use for /hig (default design+implement), /hig review, /hig adapt, /hig upgrade
  (or "HIG upgrade"). Works on SwiftUI/UIKit, web/CSS, and other UI stacks —
  not React-only. Preserves project brand colors and fonts.
argument-hint: "[review|adapt|upgrade] [target]"
user-invocable: true
---

# Apple HIG (`/hig`)

One command reads **this** project, then swarms HIG surfaces in place until the UI is Apple-native: extreme simplicity, clarity, restraint.

Brand tokens stay in the host. `/hig` does not inject a React kit.

## Commands

| Invoke | What happens |
|---|---|
| `/hig` | **Default:** ingest → design artifacts → **parallel swarm** apply (load `references/verbs/design.md`) |
| `/hig review [screens]` | Report-only gold QA — **never auto-fix** |
| `/hig adapt [surface]` | One-surface structural fix when the user asks |
| `/hig upgrade` | Pull latest `apple-hig` from GitHub + `./setup` (also say **HIG upgrade**) |

Internal only: old `teach` / `craft` / `section` files may exist; do not route users through them.

For `/hig upgrade`, load `references/verbs/upgrade.md` (or skill `hig-upgrade`) and **do not** run design/review preflight.

## Setup (non-optional)

Before mutating project files:

1. Resolve skill root (directory of this `SKILL.md`).
2. Run `node <skill>/scripts/load-context.mjs` and consume **full** JSON.
3. Read `HIG_PREFLIGHT`. If `mutation=unsupported`, print `stopLine` and stop (backend/docs with no UI).
4. Load `knowledge/canon.md` + matching verb (`design.md` by default).
5. If `stack.family` is `web` and `stack.kind` is React/Next, also load sibling skill `hig-react` (optional mapping only).
6. Emit:

```text
HIG_PREFLIGHT: <value from JSON>
```

## Any-model contract (non-optional)

Works even when Task/swarm is unavailable. Soft “feels Apple” is not a PASS.

1. Do not rewrite host fonts or invent a face. Colors and typeface stay with the product.
2. Wave 0 **apply** only `requiredIds` (12) from `knowledge/surfaces.yaml` (the apply SSOT) until `check-chrome.mjs` is P0-clean. Optional/gated surfaces may audit.
3. After each apply round, run `node <skill>/scripts/check-chrome.mjs` on the host and consume the JSON.
4. If `pass` is false (any P0 in `fails[]`), you may **not** print `HIG_CHROME` PASS. Run `node <skill>/scripts/apply-chrome.mjs --cwd <host> --write`, then re-check. Remaining hits: fix from `knowledge/chrome/recipes.md` and re-check.
5. Apply using `scripts/apply-chrome.mjs` for the grammar IDs it owns, then `knowledge/chrome/recipes.md` in the host language. No kit injection. Do not rewrite host fonts.
6. When chrome P0 is clean, run `node <skill>/scripts/apply-catalog.mjs --cwd <host> --write`. It accounts packed catalog topics whose `chromeIds` are clean (including IDs cited in pack **Chrome gates**), applies pack **Don't** backtick tokens onto existing widgets, then mechanically applies prose Don'ts whose **every** bullet has a scanner (required type/color/motion/a11y, plus search, writing, privacy, and branding). Other optional packed Don'ts stay pending when the host has that widget. Skip unmatched Watch/TV/Vision. Topics with no pack are `skipped-no-pack`, not injected. Surfaces with an `affordance` are `skipped-no-affordance` when the host has no matching widget — do not invent one. Required pattern kinds: `list` / `form` / `overlay` / `chrome` (collection/card grids count as `list`). Optional widget kinds: `menu` / `picker` / `progress` / `search` / `notification` / `loading` / `feedback` / `onboarding` / `drag` / `settings` / `undo`. A nav link labeled Search is not a search field. Native `<select>` is a picker, not a menu. A data-entry form is not Settings. Cancel is not Undo. A 12-surface lease is not catalog done.
7. Catalog done when chrome P0 is clean and `remaining` is 0 (every catalog row is terminal). Chrome retries use a 3-round cap; catalog waves continue until accounted or the user stops. Persist `.hig/catalog-status.yaml`. Print `HIG_CATALOG` from the plan JSON (loaded/applicable/remaining are data, not a frozen pass integer).

## Shared laws

1. **Brand vs structure.** Colors, fonts, voice = `DESIGN.md` only. Packs = structure, density, materials, interaction.
2. **Apple docs, not patient apps.** Packs cite Apple HIG URLs. Do not copy Pink Depot / personal-site brand into another project.
3. **Materials.** Opaque nav and content chrome. Glass only on functional overlays (sheets, alerts, pickers) with a solid fallback (`@supports` on the web).
4. **List columns are browsers.** Compact toolbar, dense rows. Detail owns the large title and primary page chrome.
5. **Chrome grammar.** Load `knowledge/chrome/grammar.yaml`. Solved chrome FAILs have stable IDs (`chrome.view-mode.icons`, toolbar budget, filter density, form column cohesion, sidebar collapse). Review must cite `structure:<id>`. Soft pack prose is not a substitute.
6. **Kit lock.** Use the host’s components/tokens. Do not invent a parallel CSS or React system.
7. **Brand veto.** On `register: brand`, or when `brand_mutation_veto: spacing_and_touch_targets_locked` is in `DESIGN.md`, `/hig review` and `/hig adapt` must **not** change spacing or touch-target CSS. Report only. Structure chrome FAILs still report.
8. **Marketing ≠ app chrome.** Never force bottom tab bars or NavigationSplitView onto `register: brand` landings.
9. **Stack fidelity.** SwiftUI/UIKit stay on system containers. Web stays CSS. Detected stack from preflight wins. `native-apple` wins over incidental help/webview HTML; LaunchScreen.storyboard / leftover `.xib` do not make a SwiftUI app UIKit. Load `hig-react` only when `stack.kind` is React/Next.

## Default pipeline (swarm)

1. Preflight (`load-context.mjs`).
2. Follow `references/verbs/design.md` end-to-end: ingest → design artifacts → **fan-out surface agents** → exclusive-file apply → gold QA → chrome P0 → **catalog waves** until remaining is 0.
3. Summarize evidence (web: 768 and 375; native: compact + regular width).

## Swarm surfaces

Load `knowledge/surfaces.yaml` (`node <skill>/scripts/load-surfaces.mjs`). Launch **parallel** Task agents for **required + matching gated** ids (not every authored pack). Skip unmatched optional surfaces. Use `references/agents/surface-worker.md`.

Always-on: layout · spacing · typography · color · materials · motion · controls · navigation · lists-split · sheets · forms · accessibility

Optional examples (gate, not `requiredIds`): healthkit · game-center · mac-chrome · gs-iphone-duo

Then `references/agents/synthesizer.md` → leased apply workers (`references/agents/apply-worker.md`).

## Pattern packs

Compose from `knowledge/packs/`:

- `foundations-layout`, `foundations-spacing`, `foundations-materials`, `foundations-color`, `foundations-typography`, `foundations-motion`, `foundations-accessibility`
- `patterns-navigation`, `patterns-lists-detail`, `patterns-forms`, `patterns-sheets`, `patterns-controls`

Chrome FAIL criteria: `knowledge/chrome/grammar.yaml` (packs only cite IDs). Recipes: `knowledge/chrome/recipes.md`. Rubric: `knowledge/chrome/review-rubric.md`. Scanner: `scripts/check-chrome.mjs`. Mechanical apply: `scripts/apply-chrome.mjs`.

Deep Apple URLs remain in `knowledge/registry.yaml` for rare leaves. That file is not the apply catalog.

Live Apple article inventory: `knowledge/catalog.yaml` (refresh with `scripts/sync-hig-catalog.mjs`). Planner: `scripts/plan-catalog.mjs`. Catalog apply: `scripts/apply-catalog.mjs`. It does not replace wave-0 apply. Catalog `failWhen` / `passWhen` are derived at load from `grammar.yaml` plus pack **Do** / **Don't** (not the title stub, and not **Apply in host**). Required-surface, writing, privacy, and branding prose Don'ts use `knowledge/chrome/dont-heuristics.yaml`.
