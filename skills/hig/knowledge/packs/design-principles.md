# design-principles

**Apple:** https://developer.apple.com/design/human-interface-guidelines/design-principles  
**Gate:** always (Getting started; load with host GS, not as extra chrome FAIL)  
**Compose with:** canon.md

Cross-platform distillations. Do not reprint Apple’s page. Do not freeze WWDC session recipes.

## Apple guidance

- **Purpose.** Every feature costs time and trust. Cut what does not serve the product’s job.
- **Agency.** Get people to the task. Guided flows are skippable. Undo and escape are real.
- **Responsibility.** Permission copy says why. Collect only what the product needs.
- **Familiarity.** Things that look the same work the same. System patterns for alerts and choices.
- **Flexibility.** Accessibility from the start. Preserve context across size and platform. Design each platform on purpose — do not ship an iPhone chrome vocabulary as the Mac or games UI.
- **Simplicity.** Not empty minimalism. Hierarchy, concise labels, only what is necessary.
- **Craft.** Type, motion, and wording stay precise. Shipping is not the finish.
- **Delight.** Emotion from getting the rest right — not decoration that blocks the task.

Canon still maps the older six (aesthetic integrity, consistency, direct manipulation, feedback, metaphors, user control). Apply both: new GS principles for decisions; the six for control-level behaviour.

## Do

- Prefer platform conventions over a second widget vocabulary.
- Keep cancel / dismiss available; destructive actions distinct.
- Match appearance to purpose (dense tool vs immersive game vs marketing landing).

## Don't

- Claim coverage of Watch, TV, or Vision from this pack.
- Treat house taste (opaque nav, 768/375-only gold QA) as these principles.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | System containers and roles; skip custom chrome that fights Materials |
| UIKit / AppKit | System bars, menus, windows; standard keyboard shortcuts |
| Web / CSS | Host tokens; structure and density from packs — not a React kit |
| Games | Same principles; HUD and input live in `designing-for-games.md` |
