# system-status-bars

**Apple:** [Status bars](https://developer.apple.com/design/human-interface-guidelines/status-bars)  
**Also:** [Materials](https://developer.apple.com/design/human-interface-guidelines/materials), [Going full screen](https://developer.apple.com/design/human-interface-guidelines/going-full-screen)  
**Surface id (later):** `status-bars`  
**Gate (later):** phone / iPad (not macOS, tvOS, visionOS, watchOS)

## Apple guidance (1:1)

- The status bar is time, network, battery along the top edge. Background is transparent; content showing through must not look tappable and must not hide the items.
- Prefer a **scroll edge effect** (blur behind the status bar) over painting a custom opaque strip that fights system materials.
- May hide temporarily for full-screen media. Must not stay hidden: people need time and connectivity without leaving the app. Restore with a simple gesture (Photos: tap).

## Don't

- Permanently hide the status bar.
- Cover the status bar with a competing fake clock.
- Paint a custom opaque strip that fights status-bar materials.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI / UIKit | Extend content under the bar; `ScrollEdgeEffectStyle`; hide only for immersive media with a reveal gesture |
| Web | `env(safe-area-inset-top)`; do not cover the iOS status bar with a competing fake clock |

## Checklist

- [ ] Status bar remains readable
- [ ] No permanent hide
- [ ] No custom opaque fill that fights glass
