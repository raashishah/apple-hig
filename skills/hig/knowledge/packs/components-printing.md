# components-printing

**Apple:** [Printing](https://developer.apple.com/design/human-interface-guidelines/printing)  
**Also:** [Activity views](https://developer.apple.com/design/human-interface-guidelines/activity-views)  
**Surface id (later):** `printing`  
**Compose with:** `activity-views` when the same Print row lives in a share sheet; do not treat a share-sheet Print row as this widget  
**Gate (later):** `always` when the host has a dedicated Print action; skip otherwise

An iOS, iPadOS, macOS, or visionOS app can integrate system-provided print functionality when it makes sense. Do not invent a printer. Do not map this pack onto a share-sheet Print row.

## Apple guidance (1:1)

- Present a printing option only when it is possible. If nothing onscreen is printable, dim or hide Print. A custom print button does the same.
- Use the system-provided print view for page range, copies, and two-sided options the printer supports.
- Do not duplicate system page-orientation or reverse-order options in a custom page-setup dialog.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A Print action shown when nothing is printable.
- Duplicate system page-orientation options.

## Apply in host

Map onto an existing Print action (`window.print`, `UIPrintInteractionController`, `NSPrintOperation`, `data-print`). Do not turn a share-sheet Print row into this pack. Do not inject a kit. Do not invent a printer or dimming.

| Host | Prefer |
|---|---|
| SwiftUI | An existing Print command / `printable` content, not a new printer kit |
| UIKit | An existing `UIPrintInteractionController` action, dimmed when empty |
| AppKit | File menu Print, dimmed when nothing is printable |
| Web | An existing `data-print` / `window.print` control, not a share-sheet Print row |

## Checklist

- [ ] A real Print action exists before this pack applies
- [ ] Print hides or dims when nothing is printable
- [ ] System page-orientation stays with the system
- [ ] A share-sheet Print row is not treated as this widget
