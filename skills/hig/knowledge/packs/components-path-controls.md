# components-path-controls

**Apple:** [Path controls](https://developer.apple.com/design/human-interface-guidelines/path-controls)  
**Surface id (later):** `path-controls`  
**Compose with:** packed file-management and packed status bars when the same chrome already exists; do not treat a file browser, the iOS status bar, or a bare path word as this pack  
**Gate (later):** `always` when the host has path-control chrome (`NSPathControl`, `data-path-control`); skip otherwise

A path control sits in the window body. It does not belong in a toolbar or a status bar. Do not invent a path bar.

## Apple guidance (1:1)

- Use a path control in the window body, not the window frame. Path controls are not for toolbars or status bars.
- The Finder path bar at the bottom of the window body stays on packed file-management. The iOS status bar stays on packed status bars.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A path control placed in a toolbar or status bar.

## Apply in host

Map onto existing path-control chrome (`NSPathControl`, `data-path-control`). Do not invent a path bar, a toolbar, or a status bar. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing path chrome in the window body when it already exists |
| UIKit | Existing path chrome in the window body when it already exists |
| AppKit | `NSPathControl` in the window body, not in a toolbar or status bar |
| Web | Existing `data-path-control` in the body, not in a toolbar or status bar |

## Checklist

- [ ] A real path control exists before this pack applies
- [ ] The path control is not placed in a toolbar or status bar
- [ ] A file browser, the iOS status bar, and a bare path word stay themselves
