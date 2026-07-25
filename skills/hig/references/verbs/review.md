# Review

Gold-screen / visual HIG audit against packs + `DESIGN.md`.

## When

`/hig review <screen>[,<screen>...] [--viewport 768,375]`

## Preconditions

- Run `load-context.mjs` (full JSON)
- If `mutation=unsupported`, stop
- Design package preferred but not required for structure notes

## Hard stop — brand veto

If `reviewAdaptMutation=blocked` OR `register=brand` OR `brandMutationLocked=true`:

- You may **report** findings only.
- You must **not** edit spacing, padding, margin, gap, or touch-target CSS/JS.
- You must **not** “quick fix” P0/P1 in the same turn unless the user explicitly overrides the veto in this message.

Encoded check: `node <skill>/scripts/load-context.mjs` → `reviewAdaptMutation` must be `blocked` for brand fixtures (`hig-plugin/eval/run-dry.mjs`).

## Steps

1. Load `knowledge/chrome/grammar.yaml` + `knowledge/chrome/review-rubric.md` (via `load-chrome-grammar.mjs`)
2. Load relevant pattern packs (Chrome gates = IDs only)
3. Inspect UI at **768** and **375** (default)
4. Optional Task with `references/agents/gold-qa-reviewer.md`
5. Match chrome `failWhen` lines. Emit `structure:<rule.id>` for each hit
6. Report P0 / P1 / P2 tagged `brand` or `structure`
7. Do **not** auto-fix unless user asks **and** veto allows
8. Brand veto never suppresses structure chrome FAILs — report only, no spacing edits

## Output shape

```text
Screen: <name> @ <viewport>
Verdict: PASS | FAIL
Veto: on|off
Rules checked: chrome.view-mode.icons, …
P0:
  - structure:chrome.<id> — <observation>
P1:
  - structure:chrome.<id> — <observation>
Notes: ...
```

FAIL if any checked P0 chrome rule matches. Cite IDs, not vibes.
