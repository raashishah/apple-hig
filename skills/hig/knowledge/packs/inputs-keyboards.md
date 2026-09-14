# inputs-keyboards

**Apple:** [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)  
**Also:** [Virtual keyboards](https://developer.apple.com/design/human-interface-guidelines/virtual-keyboards), [Game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls) (key bindings)  
**Intended gate (not wired this PR):** hosts with text entry or a hardware keyboard (phone, iPad, Mac). Physical-shortcut rows apply on Mac/iPad; virtual-keyboard rows on touch. Skip watch-only later.

Do not reprint Apple’s full shortcut table. Live-link Keyboards for the catalog. Game-specific bindings live on Game controls (moved there 2025-06-09).

## Apple guidance (1:1)

- Physical keyboards exist on every platform except Apple Watch. Mac users live on them; iPad users often do.
- Support Full Keyboard Access (iOS/iPadOS/macOS). On iPad, Tab-focus text, text views, and sidebars — not buttons, segmented controls, or switches. FKA activates those controls.
- Respect standard shortcuts. Do not steal Command-C/V/X/Z/A/S/W/Q, Command-Comma (Settings), Command-F (Find), Esc (cancel). Custom shortcuts only for frequent app-unique commands.
- Prefer Command as the main modifier. Shift complements a related shortcut. Option is for less-common commands. Avoid Control (system focus / capture).
- List modifiers Control, Option, Shift, Command. Let the system localise and RTL-mirror shortcuts.
- Virtual keyboard: match `keyboardType` / content type to the field (email, number, URL). Customise Return (`Search`, `Go`) when it clarifies.
- Inset content with the keyboard layout guide. Accessory bars use system toolbar/glass; keep them task-relevant.
- Custom input views replace the keyboard only when the task is specialised (spreadsheet pad). Play the standard key click unless the user disabled keyboard sounds.
- Custom keyboard extensions: Globe-switch, no duplicate system Emoji/Dictation keys, no help UI inside the keyboard.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `.keyboardType`, `.textContentType`, `.submitLabel`; `safeAreaInset` / keyboard avoidance; `commands` / `.keyboardShortcut` that match menu items |
| UIKit | `UIKeyboardType`, `textContentType`, `UIReturnKeyType`, `UIKeyboardLayoutGuide`, `inputAccessoryView` as a toolbar; do not Tab-focus UIButton on iPad |
| Web | native `<input type>` / `inputmode` / `autocomplete`; visible `:focus-visible`; do not invent shortcut chords that clash with the browser (find, copy, refresh) |
| Mac / games | default bindings plus a customisation UI; Command next to Space for Apple keyboards; see `inputs-game-controls.md` |

## Do

- Match software keyboard to data type.
- Keep the focused field visible above the virtual keyboard.
- Mirror shortcuts in menus (Mac/iPad) so they are discoverable.

## Don't

- Placeholder-only labels (compose with forms).
- Autocomplete overlay that covers Scribble/handwriting (Pencil pack).
- Redefine Command-Z/Q for unrelated actions.

## Checklist

- [ ] Keyboard type matches the field
- [ ] Layout clears the virtual keyboard
- [ ] Standard shortcuts still mean standard things
- [ ] FKA can reach controls that Tab should not
- [ ] No Digital Crown / remote keyboard recipes
