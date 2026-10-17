# Hillclimb

Score is how many items in `defects.json` are still open.

1. Run `node skills/hig/scripts/score-practice.mjs` and record the count. The list/detail sample is the control.
2. Fix one open defect in a skill, a token slot, or a check. Do not patch a host app to hide it.
3. Rebuild the sample from scratch.
4. Run the score again. Commit only when the count drops, and include the before screenshot, the after screenshot, and both counts.
5. If the count does not drop, or the sample count rises, revert that commit.

## Check

Run `node skills/hig/scripts/score-practice.mjs`. Done only when it exits 0.
