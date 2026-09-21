# Apple HIG (`/hig`)

> Early feedback release (**v0.4.1**). Works. Not finished — [send feedback](docs/PROOF.md#how-to-send-feedback).

A Cursor **skill repo** that applies [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) **1:1** to whatever project you run `/hig` in — SwiftUI, UIKit, web/CSS, React/Next, or similar. It fans out surface agents and applies rules **in place** until the UI feels Apple-native. Your brand colors and fonts stay in the project; `/hig` teaches **structure** (navigation, lists, forms, sheets, materials), not a parallel component library.

## Install

**Requirements:** [Cursor](https://cursor.com/), Git, Node.js 18+

```bash
npx skills add raashishah/apple-hig -g -y
```

Then in any Cursor chat:

```text
/hig
```

**Contributors:** clone [`raashishah/apple-hig`](https://github.com/raashishah/apple-hig), run `./setup` (symlinks `hig`, `hig-upgrade`, `hig-react` into `~/.cursor/skills/`). See [`setup`](setup) and [`skills/hig-upgrade/SKILL.md`](skills/hig-upgrade/SKILL.md) for other install shapes.

## Commands

| Command | What happens |
|---|---|
| `/hig` | **Default.** Preflight → ingest → parallel swarm audit/apply → gold QA (up to 3 rounds) |
| `/hig review [screens] --viewport 768,375` | Report-only gold QA. **Never auto-fixes** |
| `/hig adapt [surface]` | One-surface structural fix when you ask |
| `/hig upgrade` | Pull latest from GitHub + re-link skills (also say **HIG upgrade**) |

Pipeline detail: [`skills/hig/SKILL.md`](skills/hig/SKILL.md) and [`skills/hig/references/verbs/design.md`](skills/hig/references/verbs/design.md). Surface list: [`skills/hig/knowledge/surfaces.yaml`](skills/hig/knowledge/surfaces.yaml).

## Upgrade

Nothing auto-updates. When we push to GitHub, say **HIG upgrade** or `/hig upgrade`. Full flow: [`skills/hig-upgrade/SKILL.md`](skills/hig-upgrade/SKILL.md).

## What it enforces (hard)

Chrome grammar ([`skills/hig/knowledge/chrome/grammar.yaml`](skills/hig/knowledge/chrome/grammar.yaml)) — soft prose is not enough:

| FAIL ID | Meaning |
|---|---|
| `chrome.view-mode.icons` | List/Grid must be icon segmented control, not text labels |
| `chrome.list-browser.toolbar-budget` | One compact toolbar band; rows dominate |
| `chrome.list-browser.filter-density` | Compact toggles/chips, not full-phrase checkboxes |
| `chrome.form.column-cohesion` | Title, actions, and fields share one column width |
| `chrome.sidebar.collapsible` | Product md+ sidebar can collapse |
| `chrome.bars.system-materials` | No custom opaque bar fills fighting system materials / Liquid Glass |
| `chrome.materials.fashion-glass` | Blur/glass only on overlays, never nav or content cards |
| `chrome.layout.card-grid-home` | Product home is a workspace, not a marketing card grid |
| `chrome.ive.nested-cards` | Lists/forms are not wrapped in extra card panels |

After apply, `/hig` runs `node skills/hig/scripts/check-chrome.mjs` on the host. P0 hits block PASS. Recipes: [`skills/hig/knowledge/chrome/recipes.md`](skills/hig/knowledge/chrome/recipes.md). Host fonts stay.

Principles (materials arbitration, list-as-browser, brand veto): [`skills/hig/knowledge/canon.md`](skills/hig/knowledge/canon.md). Optional React mapping (no kit): [`skills/hig-react/SKILL.md`](skills/hig-react/SKILL.md).

## How the skill “learns”

Skill files are **static** — they do not silently rewrite after a session. Per-project prefs live in `DESIGN.md`, `AGENTS.md`, and `.hig/`. Proven chrome FAILs get promoted into `grammar.yaml` + fixtures here; everyone else runs **HIG upgrade**.

## Proof

- **Pink Depot** — dogfood inventory app; gold QA @768/@375 PASS 2026-07-09
- **admissionsdemo** — portable React patient; structure without stealing Pink Depot tokens

Details, gaps, and feedback template: [`docs/PROOF.md`](docs/PROOF.md).

## Repo layout

```text
skills/hig/              # /hig orchestrator + Apple canon + swarm
skills/hig-react/        # optional React/DOM mapping (not a kit)
skills/hig-upgrade/      # "HIG upgrade" entry skill
eval/                    # dry harnesses (no patient mutation)
```

Contributors: verify with [`eval/CHECKLIST.md`](eval/CHECKLIST.md).

## Not for

- Backend-only repos (no UI → preflight stops)
- Forcing app chrome onto marketing landings (`register: brand`)
- Injecting a parallel component library or CSS kit

## License

MIT — see [LICENSE](LICENSE)
