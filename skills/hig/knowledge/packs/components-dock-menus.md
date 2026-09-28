# components-dock-menus

**Apple:** [Dock menus](https://developer.apple.com/design/human-interface-guidelines/dock-menus)  
**Surface id (later):** `dock-menus`  
**Compose with:** packed menus and Home Screen quick actions when the same chrome already exists; do not treat a menu, a quick action, or a bare Dock phrase as this pack  
**Gate (later):** `always` when the host has Dock menu chrome (`applicationDockMenu`, `data-dock-menu`); skip otherwise

A custom Dock menu command is also available somewhere else. Do not invent a Dock menu or a second command.

## Apple guidance (1:1)

- Make custom Dock menu items available in other places, too. Not everyone uses a Dock menu.
- A menu stays on packed menus. A Home Screen quick action stays on that pack.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A custom Dock menu item that is not available in other places.

## Apply in host

Map onto existing Dock menu chrome (`applicationDockMenu`, `data-dock-menu`). Do not invent a Dock menu, a menu bar, or a duplicate command. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing Dock menu chrome when it already exists |
| UIKit | Existing Dock menu chrome when it already exists |
| AppKit | `applicationDockMenu`, with the same command elsewhere |
| Web | Existing `data-dock-menu`, not a `role="menu"` |

## Checklist

- [ ] A real Dock menu exists before this pack applies
- [ ] Each custom Dock menu item also appears outside that menu
- [ ] A menu and a Home Screen quick action stay themselves
