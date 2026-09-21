# patterns-activity-rings

**Apple:** [Activity rings](https://developer.apple.com/design/human-interface-guidelines/activity-rings)  
**Surface id (later):** `activity-rings`  
**Compose with:** packed notifications when the same chrome already exists; do not treat a progress ring, a CSS circle, packed workouts, or packed HealthKit as this pack  
**Gate (later):** `always` when the host has an Activity ring widget (`HKActivityRingView`, `data-activity-rings`); skip otherwise

Activity rings show one person's Move, Exercise, and Stand progress in the system colors. They are not a generic chart, a team score, decoration, or branding. Do not invent Activity rings. Do not map this pack onto a progress bar or a CSS circle.

## Apple guidance (1:1)

- Use Activity rings only to show Move, Exercise, and Stand information. Don't replicate or modify Activity rings for other purposes. Never use Activity rings to display other types of data. Never show Move, Exercise, and Stand progress in another ring-like element.
- Use Activity rings to show progress for a single person. Never use Activity rings to represent data for more than one person.
- Never change the colors of the rings; for example, don't use filters or modify opacity.
- Don't use Activity rings for decoration. Don't use Activity rings for branding.
- Repeat-notification Don'ts stay on packed notifications when the same chrome already exists.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Activity rings used for other types of data.
- Activity rings used for more than one person.
- Recolored Activity rings.
- Activity rings used for decoration or branding.

## Apply in host

Map onto an existing Activity ring widget (`HKActivityRingView`, `WKInterfaceActivityRing`, `data-activity-rings`). Do not invent Activity rings, a black background, or ring colors. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `HKActivityRingView` when it already exists, not a custom conic gradient |
| UIKit | `HKActivityRingView` when it already exists |
| watchOS | `WKInterfaceActivityRing` when it already exists |
| Web | Existing `data-activity-rings`, not a progress bar or CSS circle |

## Checklist

- [ ] A real Activity ring widget exists before this pack applies
- [ ] Rings are not used for other types of data
- [ ] Rings are not used for more than one person
- [ ] Rings are not recolored
- [ ] Rings are not decoration or branding
- [ ] A progress bar and a CSS circle stay themselves
