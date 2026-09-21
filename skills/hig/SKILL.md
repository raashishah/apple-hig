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

1. If `appleTypeDefault.apply` is true, write that `fontFamily` into `DESIGN.md` and the host type tokens. Do not invent a display face. Brand register leaves fonts alone.
2. Round 1 **apply** only `requiredIds` (12). Optional surfaces may audit; do not lease-apply them until required P0 chrome is clean.
3. After each apply round, run `node <skill>/scripts/check-chrome.mjs` on the host and consume the JSON.
4. If `pass` is false (any P0 in `fails[]`), you may **not** print `HIG_CHROME` PASS. Fix from `knowledge/chrome/recipes.md` and re-check.
5. Apply using `knowledge/chrome/recipes.md` in the host language. No kit injection.

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
2. Follow `references/verbs/design.md` end-to-end: ingest → design artifacts → **fan-out surface agents** → exclusive-file apply → gold QA → repeat until PASS or max rounds.
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

Chrome FAIL criteria: `knowledge/chrome/grammar.yaml` (packs only cite IDs). Recipes: `knowledge/chrome/recipes.md`. Rubric: `knowledge/chrome/review-rubric.md`. Scanner: `scripts/check-chrome.mjs`.

Deep Apple URLs remain in `knowledge/registry.yaml` for rare leaves.
