# Chrome review rubric

Load `grammar.yaml`. Match observed UI to `failWhen`. Emit codes, not vibes.

## Report shape

```text
Screen: <name> @ <viewport>
Verdict: PASS | FAIL
Veto: on|off
Rules checked: chrome.…
P0:
  - structure:chrome.<id> — <observation>
P1:
  - structure:chrome.<id> — <observation>
Notes: …
```

## Rules

1. Every chrome FAIL cites `structure:<rule.id>`.
2. Brand veto (`reviewAdaptMutation=blocked`) still prints structure codes. Never suppress them.
3. Veto blocks spacing/touch-target CSS edits. Structure report stays.
4. `/hig review` never auto-fixes. `/hig adapt` may fix structure when mutation is open.
5. On `register: brand`, skip `registers: [product]` rules (e.g. sidebar collapse). Still apply `any` / forms layout if relevant.

## Screen archetypes → default gates

| Archetype | Gates |
|---|---|
| list-browser / split-list-detail | view-mode.icons, toolbar-budget, filter-density |
| form-page | form.column-cohesion |
| app-shell (product) | sidebar.collapsible |
