# Apple HIG Web (`/hig`)

> Early feedback release (**v0.3.2**). Works. Not finished. We want your screenshots and FAIL reports.

A Cursor skill that designs a **React / Next.js web app** like an Apple designer from your existing requirements, then implements structure and chrome in the same run.

Brand colors and fonts stay in **your** project. `/hig` teaches **structure** — navigation, lists, forms, sheets, materials — grounded in [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/), not copied from a patient app.

Inspired by the install/share shape of [gstack](https://github.com/garrytan/gstack): clone once, link globally, invoke with a slash command, **upgrade** when we ship.

## Install (30 seconds)

**Requirements:** [Cursor](https://cursor.com/), Git, Node.js 18+

```bash
git clone --single-branch --depth 1 https://github.com/raashishah/apple-hig.git ~/.cursor/skills/apple-hig
cd ~/.cursor/skills/apple-hig && chmod +x setup && ./setup
```

That links:

- `skills/hig` → `~/.cursor/skills/hig`
- `skills/hig-upgrade` → `~/.cursor/skills/hig-upgrade`

Then in any Cursor chat:

```text
/hig
```

### Other installs

| Method | When |
|---|---|
| `./setup` after clone into `~/.cursor/skills/apple-hig` | Recommended for most people |
| Symlink a developer checkout | You maintain the git repo yourself (e.g. contributors) |
| Cursor plugin / marketplace source | When you want `.cursor-plugin` packaging |

## Use

| Command | What happens |
|---|---|
| `/hig` | **Default.** Ingest requirements → write `DESIGN.md` + `.hig/app-design.md` + `.hig/screens.yaml` → implement structure/chrome screen by screen |
| `/hig review [screens] --viewport 768,375` | Report-only gold QA. **Never auto-fixes** |
| `/hig adapt [surface]` | One-surface structural fix when you ask |
| `/hig upgrade` | Pull latest from GitHub + re-link skills (also say **HIG upgrade**) |

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

Also baked in:

- Opaque nav/content chrome; glass only on functional overlays (`@supports` + solid fallback)
- List columns are **browsers** (compact toolbar, dense rows); detail owns the large title
- Brand veto: marketing / locked spacing projects are report-only on spacing/touch CSS
- Fail-closed preflight for non-React stacks

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

**v0.3.x is good enough to share for feedback. It is not done.**

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
skills/hig/              # /hig design · review · adapt · upgrade
skills/hig-upgrade/      # "HIG upgrade" entry skill
scripts/upgrade*.sh      # check + pull + setup
knowledge/chrome/        # grammar.yaml = FAIL SSOT
eval/                    # dry harnesses (no patient mutation)
```

## Verify locally

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
bash scripts/upgrade-check.sh
```

## Not for

- Native SwiftUI / UIKit apps (use Apple’s tools + gstack iOS skills)
- Backend-only repos
- Forcing app chrome onto marketing landings (`register: brand`)

## License

MIT — see [LICENSE](LICENSE)
