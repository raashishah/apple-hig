# Apple HIG (`/hig`)

A Cursor **skill repo** that applies [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) **1:1** to whatever project you run `/hig` in — SwiftUI, UIKit, web/CSS, or similar. Not a React design-system fashion layer.

`/hig` fans out a **swarm** of surface agents (layout, typography, colour, spacing, motion, controls, navigation, lists/split, sheets, forms, accessibility) and applies the rules **in place** on the host until the UI feels Apple-native: extreme simplicity, clarity, restraint.

Brand colors and fonts stay in **your** project.

Inspired by the install shape of [gstack](https://github.com/garrytan/gstack) and the Agent Skills CLI.

## Install

**Requirements:** [Cursor](https://cursor.com/), Git, Node.js 18+

```bash
npx skills add raashishah/apple-hig -g -y
```

That installs the skills globally (typically `~/.cursor/skills/`). Then in any Cursor chat:

```text
/hig
```

### Other installs

| Method | When |
|---|---|
| `npx skills add raashishah/apple-hig -g -y` | Recommended |
| Clone + `./setup` | `git clone https://github.com/raashishah/apple-hig.git ~/.cursor/skills/apple-hig && cd ~/.cursor/skills/apple-hig && chmod +x setup && ./setup` |
| Symlink a developer checkout | Contributors; `./setup` links `skills/hig`, `skills/hig-upgrade`, `skills/hig-react` |

## How `/hig` runs the swarm

1. **Preflight** — `load-context.mjs` detects the host stack (SwiftUI / UIKit / web / React / …). Backend-only repos stop.
2. **Ingest** — reads this project’s requirements, routes, and brand tokens. Writes `DESIGN.md` + `.hig/*` for this product (never another app’s look).
3. **Audit (parallel)** — one agent per HIG surface writes `.hig/swarm/<surface>.md` from Apple’s docs + the host files. No product edits yet.
4. **Synthesize** — exclusive file leases in `.hig/swarm/plan.yaml`. Decorative proposals are dropped.
5. **Apply (parallel)** — leased workers edit host files in the host language (system Swift containers, existing CSS — **no injected React kit**).
6. **Gold QA** — structure vs chrome grammar (`structure:chrome.*`). Repeat up to 3 rounds until it feels native.

Optional **`hig-react`**: loaded only when preflight is React/Next. Maps HIG to DOM/ARIA. Still no component library.

```text
/hig                         # swarm the whole UI
/hig review --viewport 768,375
/hig adapt <surface>
/hig upgrade                 # or say "HIG upgrade"
```

## What it enforces (hard)

Chrome grammar (`skills/hig/knowledge/chrome/grammar.yaml`) — soft prose is not enough:

| FAIL ID | Meaning |
|---|---|
| `chrome.view-mode.icons` | List/Grid must be icon segmented control, not text labels |
| `chrome.list-browser.toolbar-budget` | One compact toolbar band; rows dominate |
| `chrome.list-browser.filter-density` | Compact toggles/chips, not full-phrase checkboxes |
| `chrome.form.column-cohesion` | Title, actions, and fields share one column width |
| `chrome.sidebar.collapsible` | Product md+ sidebar can collapse |

Also baked in:

- Opaque nav/content chrome; glass only on functional overlays (solid fallback)
- List columns are **browsers**; detail owns the large title
- Brand veto: marketing / locked spacing projects are report-only on spacing/touch CSS

## Skills in this repo

```text
skills/hig/           # /hig orchestrator + Apple canon + swarm
skills/hig-react/     # optional React/DOM mapping (not a kit)
skills/hig-upgrade/   # "HIG upgrade"
```

## Verify locally

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
node eval/run-swarm.mjs
bash scripts/upgrade-check.sh
```

## License

MIT — see [LICENSE](LICENSE)
