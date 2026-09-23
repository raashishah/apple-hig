# patterns-ratings-and-reviews

**Apple:** [Ratings and reviews](https://developer.apple.com/design/human-interface-guidelines/ratings-and-reviews)  
**Surface id (later):** `ratings-and-reviews`  
**Compose with:** packed onboarding when a first-run flow already exists; do not treat a star glyph, a Mac rating indicator, or onboarding itself as this widget  
**Gate (later):** `always` when the host has a ratings prompt (`RequestReviewAction`, `SKStoreReviewController`, `data-rating-prompt`); skip otherwise

Ask for a rating only after people have used the app, at a natural break, without pestering, using the system prompt. Do not invent StoreKit. Do not map this pack onto a star glyph, packed rating-indicators, or onboarding.

## Apple guidance (1:1)

- Ask for a rating only after people have demonstrated engagement. Avoid asking on first launch or during onboarding.
- Avoid interrupting people while they are performing a task or playing a game.
- Avoid pestering people with repeated rating requests.
- Prefer the system-provided prompt. Do not invent a custom store sheet.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A rating request on first launch or during onboarding.
- A rating request that interrupts people while they perform a task.
- Repeated rating requests that pester people.

## Apply in host

Map onto an existing ratings prompt (`data-rating-prompt`, `RequestReviewAction`, `SKStoreReviewController.requestReview`). Do not turn a star glyph into this pack. Do not inject a kit. Do not invent a delay, StoreKit, or a custom review sheet.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `RequestReviewAction`, not a new star sheet |
| UIKit | Existing `SKStoreReviewController`, not a custom App Store mock |
| AppKit | The system prompt, not a Mac rating-indicator control |
| Web | An existing `data-rating-prompt` session, not every ★ |

## Checklist

- [ ] A real ratings prompt exists before this pack applies
- [ ] The prompt is not on first launch or onboarding
- [ ] The prompt does not interrupt a task
- [ ] Repeated requests do not pester
- [ ] A star glyph is not treated as this widget
