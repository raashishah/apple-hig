# components-panels

**Apple:** [Panels](https://developer.apple.com/design/human-interface-guidelines/panels)  
**Surface id (later):** `panels`  
**Compose with:** packed windows when the same chrome already exists; do not treat a sheet, a regular window, `data-window`, or `NSOpenPanel` as this pack  
**Gate (later):** `always` when the host has panel chrome (`NSPanel`, `data-panel`, `data-hud`); skip otherwise

A panel floats above the document and is not a document window. Do not list it in the Window menu's documents list, do not offer a minimize button, and do not let a HUD obscure the content it adjusts. Do not invent a panel.

## Apple guidance (1:1)

- Commands that show or hide a panel may live in the Window menu. The panel itself does not belong in that menu's documents list.
- In general, do not make a panel's minimize button available. A panel appears when needed and hides when the app is inactive.
- Do not let a HUD obscure the content it adjusts, and do not let it compete with that content.
- A sheet, a regular app window, and an open or save panel stay themselves.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A panel listed in the Window menu documents list.
- A minimize button on a panel.
- A HUD that obscures the content it adjusts.

## Apply in host

Map onto existing panel chrome (`NSPanel`, `data-panel`, `data-hud`). Do not invent a panel, a minimize button, or a Window menu. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing inspector panel chrome when it already exists, not a new window |
| UIKit | Existing panel chrome when it already exists, not a sheet |
| AppKit | `NSPanel`, not `NSWindow` and not `NSOpenPanel` |
| Web | Existing `data-panel` or `data-hud`, not `data-window` or a dialog |

## Checklist

- [ ] A real panel exists before this pack applies
- [ ] The panel is not listed in the Window menu documents list
- [ ] The panel does not offer a minimize button
- [ ] A HUD does not obscure the content it adjusts
- [ ] A sheet, a regular window, and an open or save panel stay themselves
