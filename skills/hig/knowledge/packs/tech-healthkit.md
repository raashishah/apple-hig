# tech-healthkit

**Apple:** [HealthKit](https://developer.apple.com/design/human-interface-guidelines/healthkit)  
**Surface id (later):** `healthkit`  
**Compose with:** packed privacy when the same chrome already exists; do not treat packed HomeKit, packed Activity rings, packed workouts, packed privacy, or a bare HealthKit phrase as this pack  
**Gate (later):** `always` when the host has HealthKit chrome (`HKHealthStore`, `HKQuantityTypeIdentifier`, `data-healthkit`); skip otherwise

HealthKit does not replicate the system Health permission screen, does not manage health data sharing in-app, and does not say HealthKit to people. Do not invent HealthKit. Do not complete Health permission. Do not map this pack onto packed HomeKit or packed Activity rings.

## Apple guidance (1:1)

- Avoid adding custom screens that replicate the standard permission screen's behavior or content. People expect the system-provided Health permission screen.
- Manage health data sharing solely through the system's privacy settings. Don't confuse people by building additional screens in your app that affect the flow of health data.
- Don't use the term HealthKit. HealthKit is a developer-facing term. If you need to explain how your app works with health data, say it works with the Apple Health app.
- Activity-ring Don'ts stay on packed Activity rings. Permission timing for camera, mic, and location stays on packed privacy. CareKit and ResearchKit stay on the live-link cluster. Workout sessions stay on packed workouts.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Custom screens that replicate the Health permission screen.
- In-app screens that manage health data sharing.
- The term HealthKit in user-facing copy.

## Apply in host

Map onto existing HealthKit chrome (`HKHealthStore`, `HKQuantityTypeIdentifier`, `data-healthkit`). Do not invent HealthKit, a permission replica, or a sharing screen. Do not complete Health permission, biometrics, or Medical ID. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `HKHealthStore` chrome when it already exists, not a custom Health replica |
| UIKit | `HKHealthStore` / `HKQuantityTypeIdentifier` when they already exist |
| AppKit | Existing HealthKit chrome when it already exists |
| Web | Existing `data-healthkit`, not packed HomeKit, packed Activity rings, or a generic HealthKit label |

## Checklist

- [ ] A real HealthKit widget exists before this pack applies
- [ ] The host does not replicate the Health permission screen
- [ ] The host does not manage health data sharing in-app
- [ ] Copy does not say HealthKit to people
- [ ] Packed HomeKit, packed Activity rings, packed workouts, and packed privacy stay themselves
