# designing-for-macos

**Apple:** https://developer.apple.com/design/human-interface-guidelines/designing-for-macos  
**Gate:** `macos` / desktop (skip on phone web and iPhone-only fixtures)  
**Compose with:** design-principles

Mac Getting started plus **Mac-distinct chrome musts**. iPhone tab-bar / push-nav canon is not exclusive here.

## Apple guidance

- Large, often multi-display workspace; stationary use; viewing distance about 1–3 feet.
- Inputs: keyboard + [pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices), optional [game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls), Siri.
- Several apps and windows at once; expect resize, move, hide, show, and full screen.
- Fewer nested levels and less modality than iPhone; keep density comfortable, not sparse-to-strain.
- Keyboard shortcuts for acceleration and keyboard-only work.
- Personalization: toolbars, window configuration, system colors/fonts where the host allows.

### Menu bar (must)

Live: [The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar).

- The menu bar is **always available** for app commands. Do not hide the only path to a command inside a window.
- Standard order: App · File · Edit · Format · View · app-specific · Window · Help. Prefer one-word titles.
- Keep items visible; **disable** when unavailable — do not hide them.
- Provide a **Window** menu even for a single-window app (Minimize / Zoom for Full Keyboard Access). Close lives in File, not Window.
- View customizes appearance (toolbar/sidebar/full screen); Window manages windows.
- Use system-provided menus and standard shortcuts (Copy, Paste, Save, …).

Live-link only (do not pack catalogs): [Dock menus](https://developer.apple.com/design/human-interface-guidelines/dock-menus), [Path controls](https://developer.apple.com/design/human-interface-guidelines/path-controls), [File management](https://developer.apple.com/design/human-interface-guidelines/file-management), [Going full screen](https://developer.apple.com/design/human-interface-guidelines/going-full-screen).

### Windows (must)

Live: [Windows](https://developer.apple.com/design/human-interface-guidelines/windows).

- Mac UI is **windows**, not iPhone push navigation as the only model. Primary window vs auxiliary task window.
- System frame and window controls. Do not fake traffic lights or custom frames.
- People move, resize, minimize, and zoom. Support full screen as a space, not Zoom.
- Key / main / inactive appearances come from the system — match them if chrome is custom.
- Do not stash critical actions only on a bottom bar that may sit off-screen.

### Pointing (must)

Live: [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices).

- Primary click selects/activates; secondary click opens contextual menus; scroll moves content.
- Do **not** steal systemwide gestures (Mission Control, Spaces, Desktop, Dock).
- Pointer + keyboard stay first-class together. Use standard pointer shapes for resize, text, links, drags.
- Pixel-precise selection is expected; hit regions can be smaller than 44pt **on Mac pointer UI** (Apple’s Mac button floor is 20pt minimum / 28pt default — do not fail Mac chrome for missing 44pt).

## Chrome grammar (scope)

Existing FAIL IDs (`chrome.sidebar.collapsible`, `chrome.view-mode.icons`, …) target **iPhone/iPad product shells**. Do **not** treat them as exclusive PASS/FAIL on Mac **document windows** or `register: brand` marketing. Gold QA on Mac is window + pointer evidence — **768/375 is not the only** (or required) proof.

## Do

- AppKit/SwiftUI Mac: `NSMenu` / `.commands`, `NavigationSplitView` or document windows as the host already chose.
- Web desktop admin: persistent menu or command row at the top of the app chrome; resizable columns; hover/focus — not a phone tab bar.

## Don't

- iPhone tab-bar-only exclusive canon.
- Opaque custom title bars that fight system window materials.
- Reprint Dock/path-control pixel specs.

## Apply in host

| Host | How |
|---|---|
| SwiftUI (macOS) | `WindowGroup`, `commands`, `Table` / split; not `TabView` as the only shell |
| AppKit | `NSWindow`, `NSMenu`, responders, standard window buttons |
| Mac Catalyst | Menu bar + windows; do not ship an unmodified iPhone tab shell |
| Web / CSS | Desktop product: top command chrome + windows/panes; skip this pack on phone-primary hosts |
