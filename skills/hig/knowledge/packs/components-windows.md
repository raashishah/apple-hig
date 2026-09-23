# components-windows

**Apple:** [Windows](https://developer.apple.com/design/human-interface-guidelines/windows)  
**Surface id (later):** `windows`  
**Compose with:** packed going-full-screen and file-management when the same chrome already exists; do not treat the host document, `UIWindow`, `100vh`, or a video as this widget  
**Gate (later):** `always` when the host has a dedicated app window (`NSWindow`, `data-window`, `openWindow`); skip otherwise

A window presents app content with system frames and controls. Not supported on iOS, tvOS, or watchOS. Do not invent a window. Do not map this pack onto the host document, `UIWindow`, `100vh`, or going-full-screen.

## Apple guidance (1:1)

- Avoid opening new windows as default behavior unless it makes sense for the app.
- Avoid creating custom window UI. Do not make custom window frames or controls, and do not try to replicate the system-provided appearance.
- Use the term window in user-facing content. Do not call a window a scene.
- Avoid putting critical information or actions in a bottom bar, because people often relocate a window in a way that hides its bottom edge.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- New windows opened as default behavior.
- Custom window frames or controls that replace the system window.
- A window called a scene in user-facing content.
- Critical information or actions in a window bottom bar.
- Opaque custom title bars that fight system window materials.

## Apply in host

Map onto an existing app window (`data-window`, `NSWindow`, `openWindow`). Do not turn the host document into this pack. Do not inject a kit. Do not invent a frame, a title bar, or an inspector.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `openWindow` / Mac window chrome, not `WindowGroup` as an iPhone root |
| UIKit | iPad window scenes only when they already exist; not `UIWindow` on iPhone |
| AppKit | `NSWindow`, not a custom title bar |
| Web | An existing `data-window` / `data-app-window` session, not `<html>` |

## Checklist

- [ ] A real app window exists before this pack applies
- [ ] New windows are not the default
- [ ] Frames and controls stay system-provided
- [ ] User-facing copy says window, not scene
- [ ] Critical actions are not in a bottom bar
- [ ] The host document is not treated as this widget
