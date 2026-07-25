# Changelog

## 0.3.1 — 2026-07-25

gstack-style self-update.

- `/hig update` and sibling skill `hig-update` (say **HIG update**)
- `scripts/update-check.sh` + `scripts/upgrade.sh` pull `origin/main` and re-run `./setup`
- `VERSION` file at repo root; `./setup` also links `~/.cursor/skills/hig-update`

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
