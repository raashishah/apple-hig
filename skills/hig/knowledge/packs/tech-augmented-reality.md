# tech-augmented-reality

**Apple:** [Augmented reality](https://developer.apple.com/design/human-interface-guidelines/augmented-reality)  
**Surface id (later):** `augmented-reality`  
**Compose with:** packed nearby-interactions and packed nfc when the same chrome already exists; do not treat every image, CSS 3D, Nearby Interaction, or NFC as this pack  
**Gate (later):** `always` when the host has AR chrome (`ARView`, `ARSCNView`, `rel="ar"`, `data-ar`); skip otherwise

AR experiences use approachable copy and keep the AR glyph and badge for ARKit. They do not say world detection, Adjust tracking, or plane-to-anchor, and they do not alter the glyph or badge or use them for a non-ARKit experience. Do not invent ARKit. Do not invent a reset or coaching view. Do not map this pack onto every image or CSS 3D.

## Apple guidance (1:1)

- If you must display instructional text, use approachable terminology. AR is an advanced concept that may be intimidating to some people. To help make it approachable, avoid using technical terms like ARKit, world detection, and tracking. Instead, use friendly, conversational terms that most people will understand.
- Use the AR glyph as intended. The glyph is strictly for initiating an ARKit-based experience. Never alter the glyph (other than adjusting its size and color), use it for other purposes, or use it in conjunction with AR experiences not created using ARKit.
- Use the AR badges as intended and don't alter them. Use these images exclusively to identify products or other objects that can be viewed in AR using ARKit. Never alter the badges, change their color, use them for other purposes, or use them in conjunction with AR experiences not created with ARKit.
- Reset and coaching stay a host capability. This pack does not invent a reset button or a coaching view.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- World detection, Adjust tracking, or plane to anchor in user-facing copy.
- Altered AR glyph or AR badge, or used for a non-ARKit experience.

## Apply in host

Map onto existing AR chrome (`ARView`, `ARSCNView`, `ARQuickLookPreviewing`, `rel="ar"`, `data-ar`). Do not invent ARKit, a reset, or a coaching view. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `ARView` when it already exists, not a custom 3D overlay |
| UIKit | `ARSCNView` / AR Quick Look when they already exist |
| AppKit | Not supported on Mac; skip unless the host already has this chrome |
| Web | Existing `rel="ar"` / `data-ar`, not every image or CSS 3D |

## Checklist

- [ ] A real AR widget exists before this pack applies
- [ ] Instructions do not say world detection, Adjust tracking, or plane to anchor
- [ ] The AR glyph and badge are not altered or used for a non-ARKit experience
- [ ] Every image, CSS 3D, Nearby Interaction, and NFC stay themselves
