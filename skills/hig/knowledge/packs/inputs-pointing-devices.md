# inputs-pointing-devices

**Apple:** [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)  
**Also:** [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)  
**Gate:** `ipad,desktop` on surface `inputs-pointing`. Phone and unknown hosts skip. Skip-unless affordance `pointer`. System edge swipes stay on the gesture pack. Pencil hover stays on the Pencil pack.

Pointer is extra input on iPad — it does not replace touch. visionOS pointer/eyes details wait with that platform.

## Apple guidance (1:1)

- Keep mouse/trackpad gestures consistent with the system. Do not redefine Mission Control, Dock reveal, swipe-between-pages, or other systemwide trackpad gestures.
- People move between pointer, keyboard, and touch without learning a second interaction model. Option-drag to duplicate (and similar modifiers) must match touch and pointer.
- Pointer may reveal chrome that auto-hides (minimised toolbars, playback controls) on hover; hide again when it leaves.
- iPad pointer is context-shaped (circle, I-beam over text). Use system highlight (transparent bar controls), lift (opaque small controls), hover (large regions). Magnetism belongs on highlight/lift, not hover.
- Hit padding on iPad pointer targets: about 12 pt around bezelled controls, about 24 pt around unbezelled edges. Adjacent bar-button hit regions must be contiguous so the pointer does not snap back to a circle between them.
- Custom pointer shapes stay simple and meaningful. No instructional text glued to the pointer. Hover effects: do not scale rows that would overlap neighbours.
- Mac: primary click activates; secondary click is the contextual menu; standard cursors (I-beam, resize, operation-not-allowed, pointing hand for links). Honour user customisation of secondary-click region and trackpad gestures.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI (iPad/Mac) | system buttons/lists so pointer effects come for free; `onHover` only to reveal fadeable chrome, not as the only way to activate |
| UIKit (iPad) | `UIPointerStyle` / `UIPointerInteraction`; band selection via `UIBandSelectionInteraction` on custom multi-select canvases |
| AppKit | `NSCursor` standard images; do not replace the arrow with a branded pointer |
| Web / desktop CSS | `:hover` and `:focus-visible` together; 24px+ comfortable click targets; native `cursor: text` / `pointer` / `col-resize`; never pointer-only actions without a keyboard path |

## Do

- Same action from click, tap, and keyboard where the control exists.
- System cursors for text, links, resize, and forbidden drop.
- Reveal collapsed toolbars on pointer hover when the host already minimises them.

## Don't

- Instructional text displayed with a pointer.
- A purely decorative pointer effect.

## Checklist

- [ ] Desktop-admin fixture would load pointing, not Pencil
- [ ] System trackpad/page-swipe gestures remain
- [ ] iPad pointer does not replace touch targets
- [ ] Hover is not the only affordance
