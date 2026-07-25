#!/usr/bin/env bash
# Upgrade apple-hig (gstack-style). Safe to run from any cwd.
set -euo pipefail

REPO_URL="${HIG_REPO_URL:-https://github.com/raashishah/apple-hig.git}"
SKILL_LINK="${HOME}/.cursor/skills/hig"
CANONICAL="${HOME}/.cursor/skills/apple-hig"

resolve_repo_root() {
  if [[ -n "${HIG_HOME:-}" && -d "${HIG_HOME}/.git" ]]; then
    echo "$HIG_HOME"
    return
  fi
  if [[ -d "${CANONICAL}/.git" ]]; then
    echo "$CANONICAL"
    return
  fi
  if [[ -L "$SKILL_LINK" ]]; then
    local target
    target="$(cd "$(dirname "$SKILL_LINK")" && cd "$(dirname "$(readlink "$SKILL_LINK")")/.." && pwd)"
    if [[ -d "${target}/.git" && -f "${target}/setup" ]]; then
      echo "$target"
      return
    fi
  fi
  # Running from inside a checkout
  local here
  here="$(cd "$(dirname "$0")/.." && pwd)"
  if [[ -d "${here}/.git" && -f "${here}/setup" ]]; then
    echo "$here"
    return
  fi
  return 1
}

read_version() {
  local dir="$1"
  if [[ -f "${dir}/VERSION" ]]; then
    tr -d '[:space:]' < "${dir}/VERSION"
  else
    echo "unknown"
  fi
}

INSTALL_DIR="$(resolve_repo_root)" || {
  echo "error: apple-hig install not found." >&2
  echo "Install first:" >&2
  echo "  git clone --single-branch --depth 1 ${REPO_URL} ${CANONICAL}" >&2
  echo "  cd ${CANONICAL} && chmod +x setup && ./setup" >&2
  exit 1
}

cd "$INSTALL_DIR"
OLD_VERSION="$(read_version "$INSTALL_DIR")"
OLD_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

echo "INSTALL_DIR=$INSTALL_DIR"
echo "OLD_VERSION=$OLD_VERSION"
echo "OLD_SHA=$OLD_SHA"

if [[ ! -d .git ]]; then
  echo "error: $INSTALL_DIR is not a git checkout. Re-clone to ${CANONICAL}." >&2
  exit 1
fi

STASHED=0
if [[ -n "$(git status --porcelain 2>/dev/null)" ]]; then
  echo "Note: local changes present — stashing before upgrade."
  git stash push -u -m "hig-upgrade $(date -u +%Y%m%dT%H%M%SZ)" >/dev/null
  STASHED=1
fi

git fetch origin main
REMOTE_SHA="$(git rev-parse --short origin/main)"
NEW_VERSION="$(git show origin/main:VERSION 2>/dev/null | tr -d '[:space:]' || echo unknown)"

echo "REMOTE_SHA=$REMOTE_SHA"
echo "NEW_VERSION=$NEW_VERSION"

if [[ "$OLD_SHA" == "$REMOTE_SHA" ]]; then
  echo "STATUS=up-to-date"
  if [[ "$STASHED" -eq 1 ]]; then
    git stash pop >/dev/null 2>&1 || echo "Note: stash pop failed — run: git stash pop (in $INSTALL_DIR)"
  fi
  chmod +x setup 2>/dev/null || true
  ./setup
  exit 0
fi

# Prefer fast-forward; fall back to reset for shallow clones that diverged.
if git merge-base --is-ancestor HEAD origin/main 2>/dev/null; then
  git merge --ff-only origin/main
else
  echo "Note: non-ff history — resetting to origin/main (install clone)."
  git reset --hard origin/main
fi

chmod +x setup scripts/upgrade.sh scripts/upgrade-check.sh 2>/dev/null || true
./setup

FINAL_VERSION="$(read_version "$INSTALL_DIR")"
FINAL_SHA="$(git rev-parse --short HEAD)"

echo "STATUS=upgraded"
echo "NEW_VERSION=$FINAL_VERSION"
echo "NEW_SHA=$FINAL_SHA"

if [[ "$STASHED" -eq 1 ]]; then
  echo "STASH=saved"
  echo "Note: local changes were stashed. Restore with: git -C \"$INSTALL_DIR\" stash pop"
fi

mkdir -p "${HOME}/.hig"
echo "$OLD_VERSION" > "${HOME}/.hig/just-upgraded-from"
echo "$FINAL_VERSION" > "${HOME}/.hig/last-upgraded-to"
