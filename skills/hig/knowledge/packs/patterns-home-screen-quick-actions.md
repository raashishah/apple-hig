# patterns-home-screen-quick-actions

**Apple:** [Home Screen quick actions](https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions)  
**Surface id (later):** `home-screen-quick-actions`  
**Compose with:** packed menus when the same chrome already exists; do not treat a context menu, Share, or packed App Shortcuts as this pack  
**Gate (later):** `always` when the host has Home Screen quick actions (`UIApplicationShortcutItem`, `data-quick-action`); skip otherwise

Home Screen quick actions offer a few high-value tasks from the app icon, with short titles and monochrome symbols. Do not invent a Home Screen menu. Do not map this pack onto a context menu, Share, or packed App Shortcuts.

## Apple guidance (1:1)

- Create quick actions for compelling, high-value tasks. People tend to expect at least one useful action; you can provide a total of four.
- For each quick action, provide a succinct title that instantly communicates the result. Do not include the app name or extra copy in the title or subtitle.
- Provide a familiar interface icon. Prefer SF Symbols. Do not use an emoji in place of a symbol or interface icon.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- App name or extra copy in a Home Screen quick-action title.
- An emoji used in place of a Home Screen quick-action symbol.

## Apply in host

Map onto existing Home Screen quick actions (`UIApplicationShortcutItem`, `data-quick-action`). Do not invent a Home Screen menu or an SF Symbol. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing shortcut items, not a custom Home Screen overlay |
| UIKit | `UIApplicationShortcutItem`, not a context menu |
| AppKit | Not supported |
| Web | Existing `data-quick-action`, not a Share control or a context menu |

## Checklist

- [ ] A real Home Screen quick-action widget exists before this pack applies
- [ ] Titles do not include the app name or extra copy
- [ ] Symbols are not replaced with emoji
- [ ] A context menu, Share, and packed App Shortcuts stay themselves
