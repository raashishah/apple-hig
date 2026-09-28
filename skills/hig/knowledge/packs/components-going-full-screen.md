# components-going-full-screen

**Apple:** [Going full screen](https://developer.apple.com/design/human-interface-guidelines/going-full-screen)  
**Also:** [Windows](https://developer.apple.com/design/human-interface-guidelines/windows)  
**Surface id (later):** `going-full-screen`  
**Compose with:** `windows` when the same window enters full-screen; do not treat `100vh`, a video's native controls, or the host document as this widget  
**Gate (later):** `always` when the host has a dedicated full-screen experience; skip otherwise

iPhone, iPad, and Mac offer full-screen modes that let people expand a window to fill the screen. Not supported on tvOS, visionOS, or watchOS. Do not invent a window. Do not map this pack onto `100vh` or a video element's native controls.

## Apple guidance (1:1)

- If necessary, adjust layout in full-screen mode, but do not programmatically resize the window.
- Let people choose when to exit full-screen mode. People generally do not expect full-screen mode to end automatically when they switch away or finish an absorbing activity.
- Always let people choose when to enter full-screen mode. Prefer the system Enter Full Screen control, View menu item, or Control-Command-F. Avoid offering a custom menu of window modes.
- In a game, do not change the display mode when players go full screen.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A window programmatically resized for full-screen.
- Full-screen mode that ends automatically.
- A custom menu of window modes.

## Apply in host

Map onto an existing full-screen experience (`requestFullscreen`, `toggleFullScreen`, `fullScreenCover`, `data-fullscreen`). Do not turn `100vh` or a video's native controls into this pack. Do not inject a kit. Do not invent a window or an Exit control.

| Host | Prefer |
|---|---|
| SwiftUI | An existing `fullScreenCover` / Enter Full Screen control, not a new window kit |
| UIKit | An existing full-screen presentation, not a programmatic bounds rewrite |
| AppKit | `toggleFullScreen`, not a custom window-mode menu |
| Web | An existing `data-fullscreen` / `requestFullscreen` control, not `100vh` |

## Checklist

- [ ] A real full-screen experience exists before this pack applies
- [ ] The window is not programmatically resized for full-screen
- [ ] Full-screen does not end automatically
- [ ] Window modes stay with the system control
- [ ] `100vh` and a video's native controls are not treated as this widget
