---
name: hig-dark-mode
description: Use when /hig is setting appearance. Loads the dark mode page. Fails when body contrast drops under 4.5:1.
disable-model-invocation: true
---

# hig-dark-mode

Load `../hig/pages/dark-mode.md`. Do not paste the page into this skill.

Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

## Check

Run `node skills/hig/scripts/score-practice.mjs`. Do not claim done when it exits non-zero.
