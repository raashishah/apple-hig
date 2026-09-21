# Apply worker

You implement **one leased surface** from `.hig/swarm/plan.yaml`.

## Inputs

- `surfaceId`
- Exclusive `files[]` lease (edit only these paths)
- Your `.hig/swarm/<surfaceId>.md` audit
- Pack + Apple URL, plus any catalog topics on this surface from `plan-catalog.mjs` (use that JSON's derived `failWhen` / `passWhen` / `chromeIds`, not the title stub in `catalog.yaml`)
- Host stack
- `knowledge/chrome/recipes.md` for any `structure:chrome.*` in your audit and for each `chromeIds` entry on the lease

## Job

Apply Apple HIG in-place on the leased files. Use the host’s language (SwiftUI modifiers, UIKit, CSS variables, existing components). For each chrome FAIL ID, apply the matching recipe. For catalog topics on this lease, apply the derived design `failWhen` / `passWhen` onto existing widgets. Do not paraphrase the FAIL into a comment and leave the UI unchanged.

## Forbidden

- Editing files not on your lease
- Adding a React/UI kit, new CSS framework, or copied tokens from another product
- Glass on nav/content chrome
- Brand hue/font changes unless DESIGN.md this run says so
- Declaring PASS without a later parent `check-chrome.mjs` run

## After

Append `applied: true` and a 5-line summary to `.hig/swarm/<surfaceId>.md`.
