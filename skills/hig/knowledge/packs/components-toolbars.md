# components-toolbars

**Apple:** [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)  
**Also:** [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)  
**Surface id (later):** `toolbars` — not a replacement for required `navigation`  
**Compose with:** navigation, materials  
**Gate (later):** `always` on native app chrome; skip marketing sites

iOS navigation-specific toolbars are **sometimes called** a navigation bar. Canonical HIG page is Toolbars. Do not cite `/navigation` (404) or keep `/navigation-bars` as canonical (301 → Toolbars).

## Apple guidance (1:1)

- A toolbar is frequently used commands, navigation, title, and search along the top or bottom edge. Tab bars navigate **areas** of the app; toolbars act on the **current** view.
- Choose items so people can distinguish and activate each one. Define overflow as the bar narrows. On iPadOS and macOS the system adds overflow — do not ship a custom overflow by default.
- Prefer **standard** bar components. Do not paint custom opaque bar fills that fight system background effects. Use the content layer (and `ScrollEdgeEffectStyle` when needed) to separate bar from content. Live-link Liquid Glass pixels.
- Prefer system symbols **without** borders. Use `.prominent` for one trailing primary (`Done`, `Submit`).
- Titles: useful, concise (aim under 15 characters). Never title a window with the app name. Leave the title empty when content already orients.
- Use standard Back and Close symbols; do not label them “Back” or “Close”.
- Group by function. Aim for at most three groups. Pin leading (back, sidebar, title, document menu), centre (common actions; customisable / overflow), trailing (search, More, primary). Keep text-labelled buttons visually separated from symbol-only items.
- iOS: only the most important items in the main bar; More for the rest. Large titles shrink on scroll.
- macOS: every toolbar command must also exist in the menu bar. Toolbar can be hidden or customised.

## Apply in host

Use the platform bar. Do not restyle a custom `div` into a fake iOS nav bar with an opaque fill that fights glass.

| Host | Prefer |
|---|---|
| SwiftUI | `NavigationStack` + `.toolbar` / `ToolbarItem`; `navigationBarTitleDisplayMode`; system Back |
| UIKit | `UINavigationBar` / `UIToolbar`; `UIBarButtonItem`; large titles; no custom bar background colour |
| AppKit | `NSToolbar`; mirror commands in the menu bar |
| Web | One compact header band; `role="toolbar"` or `<header>`; do not freeze glass pixels |

## Chrome gates

- `chrome.list-browser.toolbar-budget`

## Checklist

- [ ] Toolbars cited, not `/navigation` or canonical `/navigation-bars`
- [ ] No custom opaque bar fill fighting system materials
- [ ] One prominent trailing primary at most
- [ ] Standard Back/Close symbols
- [ ] Mac: commands also in the menu bar
