# components-edit-menus

**Apple:** [Edit menus](https://developer.apple.com/design/human-interface-guidelines/edit-menus)  
**Also:** [Menus](https://developer.apple.com/design/human-interface-guidelines/menus), [Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)  
**Surface id (later):** `edit-menus`  
**Compose with:** required `controls` when the same selection is leased; do not treat a command `role="menu"` or the Mac menu bar as an edit menu  
**Gate (later):** `always` when the host has a real edit menu; skip otherwise

An edit menu lets people change selected content and offers related commands like Copy, Select, Translate, and Look Up. Do not invent an edit menu. Do not map this pack onto a command menu, a share sheet, or the Mac menu bar.

## Apple guidance (1:1)

- Prefer the system-provided edit menu. Creating a custom menu that presents the same commands is redundant and confusing.
- Reveal the menu with the system-defined interactions people already know (touch and hold, secondary click). Do not invent a custom reveal.
- Offer commands that apply in the current context. If nothing is selected, do not show Cut or Copy. If the pasteboard is empty, do not show Paste.
- Do not add other controls that perform the same functions as edit menu items. People expect familiar edit commands in the edit menu or as standard keyboard shortcuts.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A custom menu that presents the same commands as the system edit menu.
- Cut or Copy shown when nothing is selected.
- Other controls that perform the same functions as edit menu items.

## Apply in host

Map onto an existing edit menu (`UIMenuController`, `UIEditMenuInteraction`, `data-edit-menu`). Do not turn a command menu into this pack. Do not inject a kit. Do not invent Cut, Copy, or Paste.

| Host | Prefer |
|---|---|
| SwiftUI | The system `.editMenu` / selection edit commands, not a custom duplicate |
| UIKit | `UIEditMenuInteraction` / `UIMenuController` on selected content |
| AppKit | The system Edit menu and selection context commands, not extra redundant buttons |
| Web | An existing `data-edit-menu` on selected content, not `role="menu"` |

## Checklist

- [ ] A real edit menu exists before this pack applies
- [ ] Cut/Copy hide or dim when nothing is selected
- [ ] Custom duplicates of system edit commands stay out
- [ ] A command menu or the Mac menu bar is not treated as this widget
