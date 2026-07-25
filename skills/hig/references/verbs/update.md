# `/hig update`

Upgrade the installed `apple-hig` skill from GitHub (same job as the `hig-update` skill).

Load and follow `../../../hig-update/SKILL.md` end-to-end (sibling skill under `skills/hig-update/`).

If that path is awkward from the skill root, run:

```bash
HIG_SKILL="$(readlink ~/.cursor/skills/hig)"
HIG_ROOT="$(cd ~/.cursor/skills && cd "$(dirname "$HIG_SKILL")/.." && pwd)"
bash "$HIG_ROOT/scripts/update-check.sh"
# then if upgrade-available:
bash "$HIG_ROOT/scripts/upgrade.sh"
```

Then summarize CHANGELOG between old and new VERSION.
