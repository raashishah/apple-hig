# Apple HIG Web (`/hig`)

> Early feedback release (v0.3.1). Works. Not finished. We want your screenshots and FAIL reports.

A Cursor skill that designs a **React / Next.js web app** like an Apple designer from your existing requirements, then implements structure and chrome in the same run.

Brand colors and fonts stay in **your** project. `/hig` teaches **structure** — navigation, lists, forms, sheets, materials — grounded in [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), not copied from a patient app.

Inspired by the install/share shape of [gstack](https://github.com/garrytan/gstack): clone once, link globally, invoke with a slash command.

## Install (30 seconds)

**Requirements:** [Cursor](https://cursor.com/), Git, Node.js 18+

```bash
git clone --single-branch --depth 1 https://github.com/raashishah/apple-hig.git ~/.cursor/skills/apple-hig
cd ~/.cursor/skills/apple-hig && chmod +x setup && ./setup
```

That symlinks `skills/hig` → `~/.cursor/skills/hig`.

Then in any Cursor chat:

```text
/hig
```

### Other installs

| Method | When |
|---|---|
| `./setup` after clone | Global Cursor skill (recommended) |
| Add repo as a Cursor plugin / marketplace source | When you want `.cursor-plugin` packaging |
| Symlink only | `ln -sfn /path/to/apple-hig/skills/hig ~/.cursor/skills/hig` |

## Use

| Command | What happens |
|---|---|
| `/hig` | **Default.** Ingest requirements → write `DESIGN.md` + `.hig/app-design.md` + `.hig/screens.yaml` → implement structure/chrome screen by screen |
| `/hig review [screens] --viewport 768,375` | Report-only gold QA. **Never auto-fixes** |
| `/hig adapt [surface]` | One-surface structural fix when you ask |
| `/hig update` | Pull latest from GitHub + re-link skills (also say **HIG update**) |

### Stay current

When we push to [`raashishah/apple-hig`](https://github.com/raashishah/apple-hig), tell Cursor:

```text
HIG update
```

or `/hig update`. That runs `scripts/upgrade.sh` (gstack-style): fetch `main`, fast-forward/reset the install clone, `./setup`, summarize `CHANGELOG.md`.

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

- Opaque nav/content chrome; glass only on functional overlays (`@supports` + solid fallback)
- List columns are **browsers** (compact toolbar, dense rows); detail owns the large title
- Brand veto: marketing / locked spacing projects are report-only on spacing/touch CSS
- Fail-closed preflight for non-React stacks

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

**v0.3 is good enough to share for feedback. It is not done.**

Still soft / not yet hard FAIL IDs (seen on Pink Depot, not fully encoded):

- Starved thin list rail beside empty detail whitespace
- Nested Add → empty select loops / orphan half-width `/new` forms
- Shared list status lifecycle (`loading` \| `empty` \| `ready` \| `fault`) as a grammar rule
- CSS kit extraction (`apple-hig-kit`) — deferred until more gold passes

If something looks wrong on your app, open an issue with:

1. Viewport (768 and/or 375)
2. Screenshot
3. Which FAIL ID you expected (or a new ID proposal)

## Architecture

```text
skills/hig/
  SKILL.md                 # thin router + laws
  references/verbs/        # design (default), review, adapt
  knowledge/packs/         # Apple-cited pattern packs
  knowledge/chrome/        # grammar.yaml = FAIL SSOT
  scripts/load-context.mjs # preflight (fail-closed)
eval/                      # dry harnesses (no patient mutation)
```

## Verify locally

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
```

## Not for

- Native SwiftUI / UIKit apps (use Apple’s tools + gstack iOS skills)
- Backend-only repos
- Forcing app chrome onto marketing landings (`register: brand`)

## License

MIT — see [LICENSE](LICENSE)
