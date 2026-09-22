# components-menus

**Apple:** [Menus](https://developer.apple.com/design/human-interface-guidelines/menus)  
**Also:** [Context menus](https://developer.apple.com/design/human-interface-guidelines/context-menus), [Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons), [Pop-up buttons](https://developer.apple.com/design/human-interface-guidelines/pop-up-buttons), [The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)  
**Surface id (later):** `menus`  
**Compose with:** required `controls` (buttons/toggles/fields — not Control Center)  
**Gate (later):** `always` when the host has command lists; Mac menu-bar details may wait on U7

## Apple guidance (1:1)

- Opening a menu reveals items: commands, options, or state for the current selection. People expect system menu behaviour.
- Labels: verb or verb phrase; **title-style** capitalisation; drop articles (`a`/`an`/`the`). Append an ellipsis (…) when more input is required before the action completes.
- Unavailable items are dimmed, not missing. Keep the menu itself openable even if every item is unavailable.
- Icons: standard symbols for Share/Print/Search. All items in a group get icons, or none. Do not invent an unclear glyph.
- Order: frequent items first. Group related commands with a separator. Keep related commands together even when some are rare (Paste and Match Style stays with Paste).
- Submenus: one level; about five items; use when a term repeats (Sort by → Date / Score / Time). Prefer a submenu over indenting.
- Toggles: one changeable label (`Show Map` / `Hide Map`) or a checkmark for attributes. Clarify with a verb when On/Off is ambiguous.
- iOS/iPadOS layouts: **large** (list, default); **medium** (three labelled symbols on top) for a few frequent actions; **small** (four unlabeled symbols) only for a tight related set (Bold / Italic / Underline / Strikethrough).
- Action sheets, not menus, for choices that follow an intentional action people already started.

## Don't

- Hide unavailable items instead of dimming them.
- Nested submenus deeper than one level.
- Mix icons and no-icons in the same menu group.
- A submenu item that is unavailable when its nested items are unavailable.

## Apply in host

Do not invent a React menu kit. Map onto host menus.

| Host | Prefer |
|---|---|
| SwiftUI | `Menu`, `contextMenu`, confirmation dialogs for action-sheet cases; `preferredElementSize` on iOS/iPadOS |
| UIKit | `UIMenu` / `UIContextMenuInteraction`; `UIButton.Menu` |
| AppKit | Menu bar remains the command catalogue (see U7); `NSMenu` |
| Web | Native `<select>` / disclosure; `role="menu"` only when it matches keyboard menu behaviour |

## Checklist

- [ ] Verb labels, title case, ellipsis when more UI follows
- [ ] Dimmed unavailable items still listed
- [ ] Group icons all-or-none
- [ ] Submenus shallow
- [ ] Medium/small layouts only when the top row is a true frequent set
