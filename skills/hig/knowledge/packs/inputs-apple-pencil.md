# inputs-apple-pencil

**Apple:** [Apple Pencil and Scribble](https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble)  
**Also:** [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), [Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)  
**Gate:** `ipad+capability:pencil` on surface `inputs-pencil`. Phone, Mac, unknown, and iPad-without-Pencil hosts skip. Skip-unless affordance `pencil`. Pointer instructional text and decorative pointer effects stay on the pointing pack.

Apple lists this page as iPadOS-only. Do not ship a Digital Crown or Eyes pack here.

## Apple guidance (1:1)

- Marks happen the moment Pencil hits the screen — no mode button first. Finger and Pencil both drive chrome so people do not have to switch tools to tap a button. (Scribble is Pencil-only.)
- Respond to tilt, pressure, azimuth, barrel roll for stroke quality (width, opacity), not for navigation.
- Hover (Pencil) previews the upcoming mark (mid-range of dynamic values). Never start an action — especially destructive — on hover. Prefer Pencil hover previews over mouse hover copies of the same graphic.
- Double-tap and Squeeze: honour user Settings when the behaviours exist (eraser toggle, previous tool, colour picker, App Shortcut). Do not turn custom mappings on by default. Discrete, undoable, nondestructive. Squeeze UI appears near the Pencil tip. Barrel roll only changes the mark (e.g. highlighter angle).
- Scribble is on by default in standard text fields (not passwords). People write without tapping first. Hide placeholder as writing starts; do not autocomplete-over-ink; do not move or autoscroll the field while the Pencil is writing; enlarge small fields before/after writing, not mid-stroke. Indirect Scribble for paper-like empty space (new reminder below the list).
- Left- and right-handed: keep tools out from under the resting hand, or let people move them.
- PencilKit: freeze dynamic Dark Mode ink when marking up a photo/PDF. Compact size class: provide undo/redo in a toolbar (tool picker omits them) and keep the three-finger undo gesture.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI (iPad) | `PencilKit` canvas / `PKToolPicker`; system `TextField`/`TextEditor` for Scribble; hover via Pencil hover APIs, not a custom “ink mode” toggle |
| UIKit (iPad) | `PKCanvasView`, `UIScribbleInteraction`, `UIIndirectScribbleInteraction`; standard text views unless the field is custom |
| Web | no fake Pencil surface. If the host is iPad web, treat stylus as a precise pointer; do not block default handwriting in `contenteditable` |
| Mac / desktop CSS | skip this pack |

## Do

- Immediate ink; chrome still accepts Pencil taps.
- Undoable tool switches from double-tap / squeeze.
- Scribble everywhere text is accepted, including empty paper-like regions.

## Don't

- Hover that initiates an action.
- Double-tap that modifies content.
- Distraction while people write.
- A squeeze that could result in data loss.
- Continuously modifying the preview as Apple Pencil moves closer or farther.

## Checklist

- [ ] iPad-shaped host would load this pack
- [ ] Desktop `platform_primary: desktop` would not
- [ ] No Digital Crown / Eyes / remotes files added
- [ ] Scribble does not require a tap-to-focus dance on standard fields
