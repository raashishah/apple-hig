#!/usr/bin/env bash
# Print whether an upgrade is available. Exit 0 always; STATUS= in stdout.
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

if ! INSTALL_DIR="$(resolve_repo_root)"; then
  echo "STATUS=not-installed"
  echo "HINT=clone ${REPO_URL} to ${CANONICAL} && ./setup"
  exit 0
fi

cd "$INSTALL_DIR"
OLD_VERSION="$(read_version "$INSTALL_DIR")"
OLD_SHA="$(git rev-parse --short HEAD 2>/dev/null || echo unknown)"

git fetch origin main --quiet 2>/dev/null || true
REMOTE_SHA="$(git rev-parse --short origin/main 2>/dev/null || echo unknown)"
NEW_VERSION="$(git show origin/main:VERSION 2>/dev/null | tr -d '[:space:]' || echo unknown)"

echo "INSTALL_DIR=$INSTALL_DIR"
echo "OLD_VERSION=$OLD_VERSION"
echo "OLD_SHA=$OLD_SHA"
echo "NEW_VERSION=$NEW_VERSION"
echo "REMOTE_SHA=$REMOTE_SHA"

if [[ "$OLD_SHA" == "$REMOTE_SHA" ]]; then
  echo "STATUS=up-to-date"
else
  echo "STATUS=upgrade-available"
fi
