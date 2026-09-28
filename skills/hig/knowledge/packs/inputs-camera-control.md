# inputs-camera-control

**Apple:** [Camera Control](https://developer.apple.com/design/human-interface-guidelines/camera-control)  
**Surface id (later):** `camera-control`  
**Compose with:** packed sliders and packed controls when the same chrome already exists; do not treat a volume slider, a plain control, or a bare Camera Control phrase as this pack  
**Gate (later):** `always` when the host has Camera Control chrome (`AVCaptureControl`, `data-camera-control`); skip otherwise

The Camera Control overlay does not repeat controls that are already in the UI. Do not invent a Camera Control.

## Apple guidance (1:1)

- Avoid duplicating controls, like sliders and toggles, in the UI and the overlay when the system displays the overlay.
- A slider stays on packed sliders. A plain control stays on packed controls.
- Custom symbols stay on packed SF Symbols. This pack does not scan symbol names.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Duplicating controls in the UI and the Camera Control overlay.

## Apply in host

Map onto existing Camera Control chrome (`AVCaptureControl`, `data-camera-control`). Do not invent a Camera Control, a slider, or an overlay. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing Camera Control chrome when it already exists |
| UIKit | Existing Camera Control chrome when it already exists |
| AVFoundation | `AVCaptureControl`, not a second slider for the same setting |
| Web | Existing `data-camera-control`, not an `<input type="range">` |

## Checklist

- [ ] A real Camera Control exists before this pack applies
- [ ] Overlay controls are not duplicated in the UI
- [ ] A slider and a plain control stay themselves
