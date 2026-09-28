---
name: hig-react
description: >-
  Optional Apple HIG mapping for React/Next DOM and ARIA. Use only when /hig
  preflight stack is React or Next. Does not inject components. Apply HIG
  through the host's existing elements and CSS tokens.
user-invocable: false
---

# Apple HIG — React mapping (optional)

Load this skill **only** when `/hig` preflight `stack.kind` is `react`, `react-vite`, `next`, or `react-electron`.

This is not a component library. Do not add shadcn, a CSS kit, or copied widgets. Map Apple’s HIG onto the **host’s** JSX and tokens.

## Map

| Apple | Host React/DOM |
|---|---|
| Navigation bar / toolbar | One compact header band; `role="toolbar"` or native `<header>` |
| Tab bar | Fixed bottom `<nav>` on phone; 3–5 peers; 44px targets |
| Split view | CSS grid columns; list is a browser; detail owns the large title |
| List | Dense rows (`<ul>`/`role="list"`), hairline separators, selected state |
| Segmented control (view mode) | Icon-only buttons in a group; `aria-label`; `aria-pressed` |
| Sheet | Dialog + scrim; focus trap; Esc; solid background, optional `@supports` blur |
| Alert | Short title + 1–2 actions; destructive distinct |
| Toggle | Instant binary; not a submit |
| Reduce Motion | `prefers-reduced-motion: reduce` |

## Rules

- Follow parent `/hig` canon, chrome grammar IDs, and `knowledge/chrome/recipes.md`.
- After apply, parent runs `check-chrome.mjs`.
- Prefer semantic HTML over `div` soup.
- Bind existing CSS variables. Never introduce `--hig-*` tokens that duplicate brand.
- Glass only on overlays, with solid fallback.
