# components-disclosure-controls

**Apple:** [Disclosure controls](https://developer.apple.com/design/human-interface-guidelines/disclosure-controls)  
**Also:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)  
**Surface id (later):** `disclosure-controls`  
**Compose with:** required `forms` and `lists-split` when the same hierarchy is leased; do not treat every expand button or `<select>` as a disclosure control  
**Gate (later):** `always` when the host has a disclosure widget; skip otherwise

A disclosure control reveals and hides information tied to a specific control or view. A triangle discloses a view or list; a button discloses functionality next to a field. Do not invent a disclosure control. Do not map this pack onto a menu, a picker, or every `aria-expanded` button.

## Apple guidance (1:1)

- Use a disclosure control to hide details until they’re relevant. Keep the controls people use most at the top; hide advanced functionality by default.
- A disclosure triangle points inward from the leading edge when content is hidden and down when it is visible. Provide a descriptive label that says what is disclosed or hidden, like “Advanced Options.”
- A disclosure button points down when content is hidden and up when it is visible. Place it near the content it shows and hides.
- Use no more than one disclosure button in a single view. Multiple disclosure buttons add complexity and can be confusing.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- More than one disclosure button in a single view.
- A disclosure triangle without a descriptive label.
- Advanced details shown without hiding them until they're relevant.

## Apply in host

Map onto an existing disclosure widget (`DisclosureGroup`, `<details>`, `data-disclosure`). Do not turn a menu into a disclosure. Do not inject a kit. Do not invent a label.

| Host | Prefer |
|---|---|
| SwiftUI | `DisclosureGroup` with a visible title |
| UIKit | An existing disclosure row, not a new sheet |
| AppKit | `NSButton.BezelStyle.disclosure` / `.pushDisclosure` next to the field it expands |
| Web | An existing `<details>` / `<summary>` or `data-disclosure`, not every expand button |

## Checklist

- [ ] A real disclosure widget exists before this pack applies
- [ ] At most one disclosure button in a view
- [ ] Triangles have a descriptive label
- [ ] Advanced details stay hidden until relevant
- [ ] A menu, picker, or `aria-expanded` toolbar is not treated as this widget
