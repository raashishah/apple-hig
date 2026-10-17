# Apple HIG (`/hig`)

`/hig` builds a screen from eight Human Interface Guidelines pages, then hillclimbs the open defects on a list that opens a detail.

## Install

```bash
npx skills add raashishah/apple-hig -g -y
```

Or clone this repo and run `./setup`.

## What `/hig` reads

The router is `skills/hig/SKILL.md`. It loads `principles.md`, `brand.md`, and only the topic page a screen needs:

| Skill | Page |
|---|---|
| `hig-typography` | `skills/hig/pages/typography.md` |
| `hig-color` | `skills/hig/pages/color.md` |
| `hig-dark-mode` | `skills/hig/pages/dark-mode.md` |
| `hig-tab-bars` | `skills/hig/pages/tab-bars.md` |
| `hig-lists` | `skills/hig/pages/lists-and-tables.md` |
| `hig-buttons` | `skills/hig/pages/buttons.md` |
| `hig-text-fields` | `skills/hig/pages/text-fields.md` |
| `hig-motion` | `skills/hig/pages/motion.md` |

Each page restates Apple's guidance and links the source. Do not treat the page text as a substitute for the live article when they disagree.

`DESIGN.md` wins on look. Apple wins on behaviour. Logged look overrides are not defects.

Token slots, still empty until Fig supplies values:

- `skills/hig/tokens/web.css`
- `skills/hig/tokens/ios.swift`

Web motion curves are approximations of SwiftUI `.smooth`, `.snappy`, and `.bouncy`. The web font stack is `-apple-system, system-ui, sans-serif`. Do not ship SF font files.

## Practice fixture

`practice/list-detail/` is a list that opens a detail. Score it with:

```bash
node skills/hig/scripts/score-practice.mjs
node skills/hig/scripts/coverage.mjs
node --test skills/hig/scripts/score.test.mjs
```

`score-practice.mjs` exits non-zero when the open-defect count rises above `practice/list-detail/baseline.json`.

Playbooks: `skills/hig/playbooks/new-screen.md` and `skills/hig/playbooks/hillclimb.md`.

## License

MIT. See [LICENSE](LICENSE).
