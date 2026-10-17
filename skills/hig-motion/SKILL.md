---
name: hig-motion
description: Use when /hig is setting motion. Loads the motion page. Fails on an invented timing or a missing Reduce Motion rule.
disable-model-invocation: true
---

# hig-motion

Load `../hig/pages/motion.md`. Do not paste the page into this skill.

Source: https://developer.apple.com/design/human-interface-guidelines/motion

## Check

Run `node skills/hig/scripts/score-practice.mjs`. Do not claim done when it exits non-zero.
