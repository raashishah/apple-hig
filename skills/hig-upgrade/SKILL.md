---
name: hig-upgrade
description: >-
  Upgrade the Apple HIG Cursor skill (`/hig`) to the latest version from GitHub.
  Use when the user says HIG upgrade, /hig upgrade, upgrade hig, get latest hig,
  or pull latest apple-hig. Prefer "upgrade" over "update".
user-invocable: true
---

# `/hig upgrade` (HIG upgrade)

Upgrade `apple-hig` like gstack's `/gstack-upgrade`: pull latest from GitHub, re-run `./setup`, show what's new.

Voice / chat triggers: "HIG upgrade", "upgrade hig", "get latest hig".

## Steps (run in order)

### 1. Check

```bash
HIG_SKILL="$(readlink ~/.cursor/skills/hig)"
HIG_ROOT="$(cd ~/.cursor/skills && cd "$(dirname "$HIG_SKILL")/.." && pwd)"
bash "$HIG_ROOT/scripts/upgrade-check.sh"
```

Or, if the canonical clone exists:

```bash
bash ~/.cursor/skills/apple-hig/scripts/upgrade-check.sh
```

Parse stdout:

- `STATUS=not-installed` → print install commands from `HINT=` and stop
- `STATUS=up-to-date` → tell the user they are current (`OLD_VERSION` / `OLD_SHA`) and stop
- `STATUS=upgrade-available` → continue

### 2. Upgrade

```bash
HIG_SKILL="$(readlink ~/.cursor/skills/hig)"
HIG_ROOT="$(cd ~/.cursor/skills && cd "$(dirname "$HIG_SKILL")/.." && pwd)"
bash "$HIG_ROOT/scripts/upgrade.sh"
```

Or: `bash ~/.cursor/skills/apple-hig/scripts/upgrade.sh`

Do **not** invent a different git remote. Default: `https://github.com/raashishah/apple-hig.git`.

### 3. What's new

Read `$HIG_ROOT/CHANGELOG.md`. Summarize bullets for versions **after** `OLD_VERSION` through `NEW_VERSION` (5–7 bullets max).

```text
Apple HIG v{new} — upgraded from v{old}.

What's new:
- …
```

### 4. Guardrails

- Never force-push.
- Never delete the user's project files.
- If `STASH=saved`, remind them: `git stash pop` in `INSTALL_DIR`.
- Do not mutate patient apps during upgrade.
- If the skill cache looks stale, tell them to start a new chat.

## Install (if missing)

```bash
git clone --single-branch --depth 1 https://github.com/raashishah/apple-hig.git ~/.cursor/skills/apple-hig
cd ~/.cursor/skills/apple-hig && chmod +x setup && ./setup
```
