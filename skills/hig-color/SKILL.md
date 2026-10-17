---
name: hig-color
description: Use when /hig is setting colour. Loads the color page. Fails on a non-token colour or a second accent, unless a DESIGN.md override is logged.
disable-model-invocation: true
---

# hig-color

Load `../hig/pages/color.md`. Do not paste the page into this skill.

Source: https://developer.apple.com/design/human-interface-guidelines/color

## Check

Run `node skills/hig/scripts/score-practice.mjs`. Do not claim done when it exits non-zero.
