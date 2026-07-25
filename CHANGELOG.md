# Changelog

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
