# tech-always-on

**Apple:** [Always On](https://developer.apple.com/design/human-interface-guidelines/always-on)  
**Surface id (later):** `always-on`  
**Compose with:** packed widgets, packed Live Activities, and packed notifications when the same chrome already exists; do not treat dimmed CSS, a Lock Screen, or packed Live Activities as this pack  
**Gate (later):** `always` when the host has Always On chrome (`isLuminanceReduced`, `WKSupportsAlwaysOnDisplay`, `data-always-on`); skip otherwise

Always On keeps glanceable content on a dimmed display and hides sensitive information. Motion finishes to a rest; it does not stop instantly. Do not invent Always On. Do not map this pack onto dimmed CSS or packed Live Activities.

## Apple guidance (1:1)

- Hide sensitive information. Redact personal information that people wouldn't want casual observers to view, like bank balances or health data. Hide personal information that might be visible in a notification.
- Gracefully transition motion to a resting state; don't stop it instantly. Smoothly finishing the current motion helps communicate the transition.
- Keep-layout-consistent Don'ts stay on packed motion when the same chrome already exists.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Sensitive information left visible.
- Motion that stops instantly when Always On begins.

## Apply in host

Map onto existing Always On chrome (`isLuminanceReduced`, `WKSupportsAlwaysOnDisplay`, `supportsAlwaysOnDisplay`, `data-always-on`). Do not invent Always On, redaction, or a motion rest. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `isLuminanceReduced` chrome, not a custom dim overlay |
| UIKit | Existing Always On chrome when it already exists |
| watchOS | `WKSupportsAlwaysOnDisplay` when the host already uses it |
| Web | Existing `data-always-on`, not dimmed CSS opacity |

## Checklist

- [ ] A real Always On widget exists before this pack applies
- [ ] Sensitive information is not left visible
- [ ] Motion does not stop instantly when Always On begins
- [ ] Dimmed CSS and packed Live Activities stay themselves
