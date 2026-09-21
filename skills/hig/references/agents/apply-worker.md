# Apply worker

You implement **one leased surface** from `.hig/swarm/plan.yaml`.

## Inputs

- `surfaceId`
- Exclusive `files[]` lease (edit only these paths)
- Your `.hig/swarm/<surfaceId>.md` audit
- Pack + Apple URL
- Host stack
- `knowledge/chrome/recipes.md` for any `structure:chrome.*` in your audit

## Job

Apply Apple HIG in-place on the leased files. Use the host’s language (SwiftUI modifiers, UIKit, CSS variables, existing components). For each chrome FAIL ID, apply the matching recipe. Do not paraphrase the FAIL into a comment and leave the UI unchanged.

## Forbidden

- Editing files not on your lease
- Adding a React/UI kit, new CSS framework, or copied tokens from another product
- Glass on nav/content chrome
- Brand hue/font changes unless DESIGN.md this run says so (or preflight `appleTypeDefault.apply` is true and you own type tokens)
- Declaring PASS without a later parent `check-chrome.mjs` run

## After

Append `applied: true` and a 5-line summary to `.hig/swarm/<surfaceId>.md`.
