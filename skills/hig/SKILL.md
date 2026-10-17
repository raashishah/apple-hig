---
name: hig
description: Use when the user runs /hig or asks to build or hillclimb a screen against Apple's Human Interface Guidelines. Loads the eight topic pages and routes to the new-screen or hillclimb playbook.
user-invocable: true
argument-hint: "[new-screen|hillclimb]"
---

# /hig

Read `principles.md` and `brand.md` before building.

Build from the page files below. Do not replace them with memory.

| Topic | Page | Skill |
|---|---|---|
| Typography | `pages/typography.md` | `hig-typography` |
| Color | `pages/color.md` | `hig-color` |
| Dark Mode | `pages/dark-mode.md` | `hig-dark-mode` |
| Tab bars | `pages/tab-bars.md` | `hig-tab-bars` |
| Lists | `pages/lists-and-tables.md` | `hig-lists` |
| Buttons | `pages/buttons.md` | `hig-buttons` |
| Text fields | `pages/text-fields.md` | `hig-text-fields` |
| Motion | `pages/motion.md` | `hig-motion` |

Each topic skill points at its page and ends in a check. Load a page only when the screen uses that topic.

Tokens live in `tokens/web.css` and `tokens/ios.swift`. Do not invent values Fig has not supplied. Web motion curves are approximations of SwiftUI `.smooth`, `.snappy`, and `.bouncy`.

## Playbooks

- New screen: `playbooks/new-screen.md`
- Hillclimb: `playbooks/hillclimb.md`

## Check

Run `node skills/hig/scripts/score-practice.mjs`. Do not claim done when it exits non-zero.
