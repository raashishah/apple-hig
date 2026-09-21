# components-boxes

**Apple:** [Boxes](https://developer.apple.com/design/human-interface-guidelines/boxes)  
**Also:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Spacing](https://developer.apple.com/design/human-interface-guidelines/layout)  
**Surface id (later):** `boxes`  
**Compose with:** required `layout` and `spacing` when the same grouping is leased; do not treat every card, grouped list, or form fieldset as a box  
**Gate (later):** `always` when the host has a dedicated box widget; skip otherwise

A box creates a visually distinct group of logically related information and components. It uses a visible border or background, and it can include a title. Do not invent a box. Do not map this pack onto a card grid, a list, or extra card panels around a list or form (`chrome.ive.nested-cards`).

## Apple guidance (1:1)

- Keep a box relatively small compared with its containing view. As a box’s size gets close to the window or screen, it stops communicating a group and crowds other content.
- Use padding and alignment for subgroups inside a box. Nested boxes to define subgroups make the interface feel busy and constrained.
- Provide a succinct introductory title when it helps clarify the contents. Write a brief phrase in sentence-style capitalization.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Nested boxes to define subgroups.
- A box whose size approaches its containing view.

## Apply in host

Map onto an existing box (`NSBox`, `GroupBox`, `data-box`). Do not turn a card or fieldset into this pack. Do not inject a kit. Do not invent padding by un-nesting.

| Host | Prefer |
|---|---|
| SwiftUI | An existing `GroupBox` with a visible title, not a new card stack |
| UIKit | An existing grouped container with secondary/tertiary fill, not a new sheet |
| AppKit | `NSBox` around related controls, sized smaller than the window |
| Web | An existing `data-box` group, not every `.card` or `<fieldset>` |

## Checklist

- [ ] A real box widget exists before this pack applies
- [ ] Boxes stay smaller than the containing view
- [ ] Subgroups use space, not nested boxes
- [ ] A card, grouped list, or form fieldset is not treated as this widget
