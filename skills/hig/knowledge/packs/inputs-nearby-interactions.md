# inputs-nearby-interactions

**Apple:** [Nearby interactions](https://developer.apple.com/design/human-interface-guidelines/nearby-interactions)  
**Surface id (later):** `nearby-interactions`  
**Compose with:** packed activity-views when the same chrome already exists; do not treat a Share control, NFC, geolocation, or packed AirPlay as this pack  
**Gate (later):** `always` when the host has Nearby Interaction chrome (`NISession`, `NINearbyObject`, `data-nearby`); skip otherwise

A nearby interaction is an Ultra Wideband presence session. It is not the only way to perform a task, and it does not tell people to hold the device in portrait. Do not invent Nearby Interaction. Do not map this pack onto a Share control, NFC, or geolocation.

## Apple guidance (1:1)

- Avoid using a nearby interaction as the only way to perform a task. You can't assume that everyone can experience a nearby interaction, so it's essential to provide alternative ways to get things done in your app.
- If you support only portrait orientation while your nearby interaction feature runs, prefer giving people implicit, visual feedback on how to hold the device for an optimal experience; when possible, avoid explicitly telling people to hold the device in portrait.
- Continuous-feedback Don'ts stay on packed feedback when the same chrome already exists.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Nearby interaction as the only way to perform a task.
- Explicit instruction to hold the device in portrait.

## Apply in host

Map onto existing Nearby Interaction chrome (`NISession`, `NINearbyPeerConfiguration`, `NINearbyObject`, `NIDiscoveryToken`, `NearbyInteraction`, `data-nearby`). Do not invent Nearby Interaction, a fallback control, or portrait coaching copy. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `NISession` chrome, not a custom proximity overlay |
| UIKit | Existing Nearby Interaction chrome when it already exists |
| AppKit | Not supported on Mac; skip unless the host already has this chrome |
| Web | Existing `data-nearby`, not a Share button, NFC, or geolocation |

## Checklist

- [ ] A real Nearby Interaction widget exists before this pack applies
- [ ] Nearby interaction is not the only way to perform a task
- [ ] People are not told to hold the device in portrait
- [ ] A Share control, NFC, and geolocation stay themselves
