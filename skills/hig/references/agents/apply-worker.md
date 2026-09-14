# Apply worker

You implement **one leased surface** from `.hig/swarm/plan.yaml`.

## Inputs

- `surfaceId`
- Exclusive `files[]` lease (edit only these paths)
- Your `.hig/swarm/<surfaceId>.md` audit
- Pack + Apple URL
- Host stack

## Job

Apply Apple HIG in-place on the leased files. Use the host’s language (SwiftUI modifiers, UIKit, CSS variables, existing components).

## Forbidden

- Editing files not on your lease
- Adding a React/UI kit, new CSS framework, or copied tokens from another product
- Glass on nav/content chrome
- Brand hue/font changes unless DESIGN.md this run says so

## After

Append `applied: true` and a 5-line summary to `.hig/swarm/<surfaceId>.md`.
