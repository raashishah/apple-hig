# Adapt

Incremental move of one existing surface toward HIG structure without a full rewrite or brand change.

## When

`/hig adapt <surface-or-route>`

## Preconditions

- `load-context.mjs`
- Prefer existing `DESIGN.md`; if missing, run default design ingest for brand lock first or stop with one line

## Hard stop — brand veto

If `reviewAdaptMutation=blocked` OR `register=brand` OR `brandMutationLocked=true`:

- **Do not** change spacing or touch-target CSS.
- Structural reorders that do not alter spacing tokens are allowed only when clearly structure (e.g. moving a title into detail) — when unsure, report and stop.
- Prefer telling the user to run bare `/hig` for a deliberate design pass.

## Steps

1. Load `knowledge/chrome/grammar.yaml` (via `load-chrome-grammar.mjs`) and bind rules for this surface’s archetype
2. Identify packs (navigation, lists/detail, forms, sheets, materials)
3. Diff surface vs pack checklists **and** chrome `failWhen` lines
4. Apply smallest structural fixes (chrome hierarchy, list/detail ownership, chrome grammar PASSes)
5. Preserve brand tokens and copy
6. Re-check with `/hig review` on the same surface (report-only; expect `structure:chrome.*` clear)

## Rules

- One surface only
- Kit lock: adapt through existing components
- No glass on primary chrome
- Structure chrome FAILs are in scope when mutation is open; spacing stays veto-locked
