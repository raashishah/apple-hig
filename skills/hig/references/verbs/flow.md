# Flow

Create missing product structure from `.hig/screens.yaml`. This is the only `/hig` path that may add UI.

## When

- `/hig flow`
- Preflight is `mutation=unsupported` because the repo has no UI, and a flow graph exists
- The graph names a screen the host does not have

## Stop

- No UI and no `.hig/screens.yaml`: print `stopLine` from `load-context.mjs` and stop. Do not change that line.
- `register: brand`: stop. Do not put app chrome on a brand landing.
- Parse errors (action with no destination, two list statuses, create that is both short and long): stop and report the code.

## Write

Only list, form, overlay, and chrome, in the host stack. One compact header, a dense list, a form column, a sheet dialog.

Do not inject a kit, `--hig-*` tokens, or a font. Do not add Settings, search, Apple Pay, Sign in with Apple, or biometrics. `apply-catalog.mjs` still skips a missing affordance.

```bash
node <skill>/scripts/hig-flow.mjs --cwd <host>
```

A second run does not duplicate patterns that are already there.
