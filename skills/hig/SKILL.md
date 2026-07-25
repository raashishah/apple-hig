---
name: hig
description: >-
  Design a whole React web app like an Apple designer from existing requirements,
  then implement structure and chrome in the same run. Use for /hig (default),
  /hig review, /hig adapt; Apple-like navigation, lists, forms, sheets, materials.
  Preserves project brand colors and fonts. Not for native SwiftUI or backend-only.
argument-hint: "[review|adapt] [target]"
user-invocable: true
---

# Apple HIG Web

One command designs the whole app, then implements it. Brand tokens stay in the project.

## Commands

| Invoke | What happens |
|---|---|
| `/hig` | **Default:** design + implement (load `references/verbs/design.md`) |
| `/hig review [screens]` | Report-only gold QA @768/375 — **never auto-fix** |
| `/hig adapt [surface]` | One-surface structural fix when user asks |

Internal only (do not offer as menu): old `teach` / `craft` / `section` files may exist for reference; do not route users through them.

## Setup (non-optional)

Before mutating project files:

1. Resolve skill root (directory of this `SKILL.md`).
2. Run `node <skill>/scripts/load-context.mjs` and consume **full** JSON.
3. Read `HIG_PREFLIGHT`. If `mutation=unsupported`, print `stopLine` and stop.
4. Load the matching verb file (`design.md` by default).
5. Emit:

```text
HIG_PREFLIGHT: <value from JSON>
```

## Shared laws

1. **Brand vs structure.** Colors, fonts, voice = `DESIGN.md` only. Pattern packs = structure, density, materials, interaction.
2. **Apple docs, not patient apps.** Packs cite Apple HIG URLs. Do not copy Pink Depot / personal-site brand into another project.
3. **Materials.** Opaque nav and content chrome. Glass only on functional overlays (sheets, alerts, pickers) inside `@supports`, with solid fallback.
4. **List columns are browsers.** Compact toolbar, dense rows. Detail owns large title and primary page chrome.
5. **Chrome grammar.** Load `knowledge/chrome/grammar.yaml`. Solved chrome FAILs have stable IDs (`chrome.view-mode.icons`, toolbar budget, filter density, form column cohesion, sidebar collapse). Review must cite `structure:<id>`. Soft pack prose is not a substitute.
6. **Kit lock.** Use the project’s components/tokens. Do not invent a parallel CSS system.
7. **Brand veto.** On `register: brand`, or when `brand_mutation_veto: spacing_and_touch_targets_locked` is in `DESIGN.md`, `/hig review` and `/hig adapt` must **not** change spacing or touch-target CSS. Report only. Structure chrome FAILs still report.
8. **Marketing ≠ app chrome.** Never force bottom tab bars or NavigationSplitView onto `register: brand` landings.

## Default pipeline

1. Preflight (`load-context.mjs`).
2. Follow `references/verbs/design.md` end-to-end (ingest → design artifacts → serial implement by screen).
3. Summarize evidence (viewports 768 and 375).

## Pattern packs

Compose from `knowledge/packs/`:

- `foundations-layout`, `foundations-materials`, `foundations-color`, `foundations-typography`
- `patterns-navigation`, `patterns-lists-detail`, `patterns-forms`, `patterns-sheets`

Chrome FAIL criteria: `knowledge/chrome/grammar.yaml` (packs only cite IDs). Rubric: `knowledge/chrome/review-rubric.md`.

Deep Apple URLs remain in `knowledge/registry.yaml` for rare leaves.
