# inputs-gyro-and-accelerometer

**Apple:** [Gyroscope and accelerometer](https://developer.apple.com/design/human-interface-guidelines/gyro-and-accelerometer)  
**Surface id (later):** `gyro-and-accelerometer`  
**Compose with:** packed gestures when the same chrome already exists; do not treat a swipe, a scroll view, or CSS motion as this pack  
**Gate (later):** `always` when the host has a motion API (`CMMotionManager`, `DeviceMotionEvent`, `data-gyro`); skip otherwise

Motion sensors offer a tangible benefit, and they do not drive the interface outside of active gameplay. Do not invent Core Motion. Do not map this pack onto a swipe, a scroll view, or packed gestures.

## Apple guidance (1:1)

- Use motion data only to offer a tangible benefit to people. Avoid gathering data simply to have the data.
- Outside of active gameplay, avoid using accelerometers or gyroscopes for the direct manipulation of your interface. Some motion-based gestures are hard to replicate, physically challenging, and costly for battery.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Motion data gathered with no tangible benefit.
- Accelerometer or gyroscope used to directly manipulate the interface outside of active gameplay.

## Apply in host

Map onto an existing motion API (`CMMotionManager`, `DeviceMotionEvent`, `data-gyro`). Do not invent Core Motion or a gameplay mode. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing Core Motion reads for fitness or gameplay, not tilting every control |
| UIKit | `CMMotionManager` when it already exists, not a tilt-to-scroll pane |
| AppKit | Existing motion reads when they already exist |
| Web | Existing `DeviceMotionEvent` / `data-gyro`, not a swipe or CSS transform |

## Checklist

- [ ] A real motion API exists before this pack applies
- [ ] Motion data has a tangible benefit
- [ ] The interface is not tilted or shaken outside of active gameplay
- [ ] A swipe, a scroll view, and CSS motion stay themselves
