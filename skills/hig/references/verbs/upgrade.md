# `/hig upgrade`

Upgrade the installed `apple-hig` skill from GitHub (same job as the `hig-upgrade` skill).

Load and follow `../../../hig-upgrade/SKILL.md` end-to-end.

```bash
HIG_SKILL="$(readlink ~/.cursor/skills/hig)"
HIG_ROOT="$(cd ~/.cursor/skills && cd "$(dirname "$HIG_SKILL")/.." && pwd)"
bash "$HIG_ROOT/scripts/upgrade-check.sh"
# then if upgrade-available:
bash "$HIG_ROOT/scripts/upgrade.sh"
```

Then summarize CHANGELOG between old and new VERSION.
