---
name: hig-update
description: >-
  Upgrade the Apple HIG Cursor skill (`/hig`) to the latest version from GitHub.
  Use when the user says HIG update, /hig update, update hig, upgrade hig,
  get latest hig, or pull latest apple-hig.
user-invocable: true
---

# `/hig update` (HIG update)

Upgrade `apple-hig` like gstack's `/gstack-upgrade`: pull latest from GitHub, re-run `./setup`, show what's new.

Voice / chat triggers: "HIG update", "update hig", "upgrade hig", "get latest hig".

## Steps (run in order)

### 1. Check

Resolve skill/repo root, then:

```bash
bash "$(
  python3 - <<'PY'
import os
from pathlib import Path
link = Path.home() / ".cursor/skills/hig"
if link.is_symlink():
    # skills/hig -> repo/skills/hig ; repo root is parents[1]
    root = link.resolve().parents[1]
    print(root / "scripts" / "update-check.sh")
elif (Path.home() / ".cursor/skills/apple-hig/scripts/update-check.sh").exists():
    print(Path.home() / ".cursor/skills/apple-hig/scripts/update-check.sh")
else:
    print("MISSING")
PY
)"
```

If that path is awkward, prefer:

```bash
# From known install (canonical clone)
bash ~/.cursor/skills/apple-hig/scripts/update-check.sh
# OR from developer checkout resolved via the /hig symlink
bash "$(dirname "$(dirname "$(readlink -f ~/.cursor/skills/hig 2>/dev/null || readlink ~/.cursor/skills/hig)")")/scripts/update-check.sh"
```

On macOS without `readlink -f`:

```bash
HIG_SKILL="$(readlink ~/.cursor/skills/hig)"
HIG_ROOT="$(cd ~/.cursor/skills && cd "$(dirname "$HIG_SKILL")/.." && pwd)"
bash "$HIG_ROOT/scripts/update-check.sh"
```

Parse stdout. If `STATUS=not-installed`, print the install commands from the script `HINT=` and stop.

If `STATUS=up-to-date`, tell the user they are current (`OLD_VERSION` / `OLD_SHA`) and stop.

If `STATUS=upgrade-available`, continue.

### 2. Upgrade

```bash
HIG_SKILL="$(readlink ~/.cursor/skills/hig)"
HIG_ROOT="$(cd ~/.cursor/skills && cd "$(dirname "$HIG_SKILL")/.." && pwd)"
bash "$HIG_ROOT/scripts/upgrade.sh"
```

Or: `bash ~/.cursor/skills/apple-hig/scripts/upgrade.sh` when that clone exists.

Do **not** invent a different git remote. Default remote is `https://github.com/raashishah/apple-hig.git`.

### 3. What's new

Read `$HIG_ROOT/CHANGELOG.md` (or canonical clone). Summarize bullets for versions **after** `OLD_VERSION` up through `NEW_VERSION` (5–7 bullets max, user-facing).

Format:

```text
Apple HIG v{new} — upgraded from v{old}.

What's new:
- …
```

If `STATUS=up-to-date` after upgrade script (race), say already current.

### 4. Guardrails

- Never force-push.
- Never delete the user's project files.
- If `STASH=saved`, remind them how to `git stash pop` in `INSTALL_DIR`.
- Do not mutate patient apps during update.
- After upgrade, `/hig` should work without restart in most cases; if the skill cache looks stale, tell them to start a new chat.

## Install (if missing)

```bash
git clone --single-branch --depth 1 https://github.com/raashishah/apple-hig.git ~/.cursor/skills/apple-hig
cd ~/.cursor/skills/apple-hig && chmod +x setup && ./setup
```
