# components-outline-views

**Apple:** [Outline views](https://developer.apple.com/design/human-interface-guidelines/outline-views)  
**Surface id (later):** `outline-views`  
**Compose with:** packed lists when the same chrome already exists; do not treat a plain list, a disclosure control, or a bare outline word as this pack  
**Gate (later):** `always` when the host has outline chrome (`NSOutlineView`, `data-outline`); skip otherwise

An outline view shows a hierarchy in columns. Column headings do not end with a colon, and a multi-column outline has headings. Do not invent an outline.

## Apple guidance (1:1)

- Use nouns or short noun phrases for column headings, with title-style capitalization and no punctuation. Do not add a trailing colon.
- Always provide column headings in a multi-column outline view.
- A plain list stays on packed lists. Non-hierarchical data stays a table, not this pack.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A trailing colon on an outline column heading.
- A multi-column outline view with no column headings.

## Apply in host

Map onto existing outline chrome (`NSOutlineView`, `data-outline`). Do not invent an outline, a column, or a heading. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing outline chrome when it already exists, not a plain list |
| UIKit | Existing outline chrome when it already exists |
| AppKit | `NSOutlineView`, not a table of non-hierarchical rows |
| Web | Existing `data-outline`, not a `<ul>` |

## Checklist

- [ ] A real outline view exists before this pack applies
- [ ] Outline column headings do not end with a trailing colon
- [ ] A multi-column outline view has column headings
- [ ] A plain list and a disclosure control stay themselves
