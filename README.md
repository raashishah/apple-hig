# Apple HIG (`/hig`)

> Early feedback release (**v0.4.0**). Works. Not finished. We want your screenshots and FAIL reports.

A Cursor **skill repo** that applies [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/) **1:1** to whatever project you run `/hig` in — SwiftUI, UIKit, web/CSS, React/Next, or similar. Not a React design-system fashion layer.

`/hig` fans out a **swarm** of surface agents (layout, typography, colour, spacing, motion, controls, navigation, lists/split, sheets, forms, accessibility, and gated platform packs) and applies the rules **in place** on the host until the UI feels Apple-native: extreme simplicity, clarity, restraint.

Brand colors and fonts stay in **your** project. `/hig` teaches **structure** — navigation, lists, forms, sheets, materials — grounded in Apple HIG docs, not copied from a patient app.

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
| Clone + `./setup` | `git clone --single-branch --depth 1 https://github.com/raashishah/apple-hig.git ~/.cursor/skills/apple-hig && cd ~/.cursor/skills/apple-hig && chmod +x setup && ./setup` |
| Symlink a developer checkout | Contributors; `./setup` links `skills/hig`, `skills/hig-upgrade`, `skills/hig-react` |
| Cursor plugin / marketplace source | When you want `.cursor-plugin` packaging |

## Use

| Command | What happens |
|---|---|
| `/hig` | **Default.** Preflight → ingest → parallel swarm audit/apply → gold QA (up to 3 rounds) |
| `/hig review [screens] --viewport 768,375` | Report-only gold QA. **Never auto-fixes** |
| `/hig adapt [surface]` | One-surface structural fix when you ask |
| `/hig upgrade` | Pull latest from GitHub + re-link skills (also say **HIG upgrade**) |

## How `/hig` runs the swarm

1. **Preflight** — `load-context.mjs` detects the host stack (SwiftUI / UIKit / web / React / …), platform, and capabilities. Backend-only repos stop. Smarter detection skips `.xcassets` and other resource trees, treats incidental help/webview HTML as `native-apple`, and ignores `LaunchScreen.storyboard` / leftover `.xib` so SwiftUI hosts are not misclassified as UIKit.
2. **Ingest** — reads this project’s requirements, routes, and brand tokens. Writes `DESIGN.md` + `.hig/*` for this product (never another app’s look).
3. **Audit (parallel)** — one agent per **gated** HIG surface in `surfaces.yaml` writes `.hig/swarm/<surface>.md` from Apple’s docs + the host files. Platform/capability gates skip inapplicable surfaces (iPad, Mac, Duo, Wallet, etc.). No product edits yet.
4. **Synthesize** — exclusive file leases in `.hig/swarm/plan.yaml`. Decorative proposals are dropped.
5. **Apply (parallel)** — leased workers edit host files in the host language (system Swift containers, existing CSS — **no injected React kit**).
6. **Gold QA** — structure vs chrome grammar (`structure:chrome.*`). Repeat up to 3 rounds until it feels native.

Optional **`hig-react`**: loaded only when preflight is React/Next. Maps HIG to DOM/ARIA. Still no component library.

## Upgrade (does **not** run automatically)

Nothing background-updates the skill. Same idea as gstack: **you** ask for an upgrade when you want the latest.

When we push to [`raashishah/apple-hig`](https://github.com/raashishah/apple-hig), tell Cursor:

```text
HIG upgrade
```

or `/hig upgrade`.

That runs `scripts/upgrade-check.sh` then `scripts/upgrade.sh`:

1. Find your install (canonical clone or the git root behind `~/.cursor/skills/hig`)
2. `git fetch origin main`
3. Fast-forward (or reset shallow clones) to latest
4. Re-run `./setup`
5. Summarize `CHANGELOG.md`

### Your machine vs a friend's machine

| Install shape | What happens when GitHub gets a new commit |
|---|---|
| **Canonical clone** at `~/.cursor/skills/apple-hig` | Skills stay stale until you run **HIG upgrade** (or `git pull` + `./setup` there) |
| **`npx skills add`** global install | Re-run `npx skills add raashishah/apple-hig -g -y` or **HIG upgrade** |
| **Symlink into a local git checkout** you already pull/push | Local edits are live immediately via the symlink. Remote-only commits still need `git pull` / **HIG upgrade** |
| No install / broken symlink | Re-run the Install block above |

There is **no** auto-upgrade on Cursor launch (yet). Prefer an explicit **HIG upgrade** so upgrades are intentional.

## What it enforces (hard)

Chrome grammar (`skills/hig/knowledge/chrome/grammar.yaml`) — soft prose is not enough:

| FAIL ID | Meaning |
|---|---|
| `chrome.view-mode.icons` | List/Grid must be icon segmented control, not text labels |
| `chrome.list-browser.toolbar-budget` | One compact toolbar band; rows dominate |
| `chrome.list-browser.filter-density` | Compact toggles/chips, not full-phrase checkboxes |
| `chrome.form.column-cohesion` | Title, actions, and fields share one column width |
| `chrome.sidebar.collapsible` | Product md+ sidebar can collapse |
| `chrome.bars.system-materials` | No custom opaque bar fills fighting system materials / Liquid Glass |

Also baked in:

- System materials on chrome; glass only on functional overlays (`@supports` + solid fallback)
- List columns are **browsers** (compact toolbar, dense rows); detail owns the large title
- Brand veto: marketing / locked spacing projects are report-only on spacing/touch CSS
- Fail-closed preflight when there is no UI to mutate

## How the skill “learns”

The skill files are **static**. They do not silently rewrite themselves after a session.

- **Per project:** `DESIGN.md`, `AGENTS.md`, `.hig/` hold that app’s brand and prefs (Cursor Continual Learning can update `AGENTS.md`)
- **Portable plugin:** when a chrome FAIL is proven on a real app, we promote it into `grammar.yaml` + fixtures and **push** this repo — then everyone runs **HIG upgrade**

## Proof so far

### Pink Depot (dogfood product UI)

Inventory / order tool. `/hig` + live gold QA @768/@375 drove:

- Fixed phone bottom nav; usable Inventory split @768
- Icon List/Grid + single-band inventory toolbar
- Cohesive add forms (header/actions/fields same width)
- Collapsible sidebar
- Shared split/list lifecycle (no dead empty “Select a…” panes; short creates in detail; long creates full-page centered)

Gold rerun **2026-07-09 PASS** unlocked kit extraction later. Chrome grammar rules were extracted from failures that kept shipping as soft “make it denser” advice.

Details: [docs/PROOF.md](docs/PROOF.md)

### admissionsdemo (portable patient)

Bare `/hig` on a different React app produced `DESIGN.md` + `.hig/*` and structure without stealing Pink Depot brand tokens.

## Status — honest

**v0.4.x is good enough to share for feedback on any UI stack. It is not done.**

Still soft / not yet hard FAIL IDs (seen on Pink Depot, not fully encoded):

- Starved thin list rail beside empty detail whitespace
- Nested Add → empty select loops / orphan half-width `/new` forms
- Shared list status lifecycle (`loading` \| `empty` \| `ready` \| `fault`) as a grammar rule
- CSS kit extraction (`apple-hig-kit`) — deferred until more gold passes

If something looks wrong on your app, open an issue with:

1. Viewport (768 and/or 375 for web; compact + regular for native)
2. Screenshot
3. Which FAIL ID you expected (or a new ID proposal)

## Architecture

```text
skills/hig/              # /hig orchestrator + Apple canon + swarm
skills/hig-react/        # optional React/DOM mapping (not a kit)
skills/hig-upgrade/      # "HIG upgrade" entry skill
knowledge/canon.md       # Apple fidelity principles
knowledge/surfaces.yaml  # swarm surface SSOT (with platform/capability gates)
scripts/upgrade*.sh      # check + pull + setup
knowledge/chrome/        # grammar.yaml = FAIL SSOT
eval/                    # dry harnesses (no patient mutation)
```

## Verify locally

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
node eval/run-swarm.mjs
bash scripts/upgrade-check.sh
```

## Not for

- Backend-only repos (no UI → preflight stops)
- Forcing app chrome onto marketing landings (`register: brand`)
- Injecting a parallel component library or CSS kit

## License

MIT — see [LICENSE](LICENSE)
