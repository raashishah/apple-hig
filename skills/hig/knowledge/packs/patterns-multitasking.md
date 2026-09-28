# patterns-multitasking

**Apple:** [Multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking)  
**Also:** [Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio), [Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications)  
**Surface id (later):** `multitasking`  
**Compose with:** packed notifications when a background task completes; do not treat a video element, `100vh`, or going-full-screen as this widget  
**Gate (later):** `always` when the host has dedicated multitasking or Picture in Picture chrome; skip otherwise

People switch away at any time. Pause attention-requiring activity, finish background work silently, and yield to primary audio interruptions. Not supported on watchOS. Do not invent pause/resume chrome. Do not map this pack onto every `<video>`, `100vh`, or a full-screen control.

## Apple guidance (1:1)

- Pause activities that require people's attention or active participation when they switch away. A game or media-viewing app must not keep going as if they were still watching.
- Pause audio indefinitely for a primary audio interruption such as music, a podcast, or an audiobook.
- Avoid sending a notification when a routine or secondary task completes. Let people check the task when they return.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Attention-requiring activity that continues when people switch away.
- A notification when a routine or secondary task completes.
- Audio that does not pause for a primary audio interruption.

## Apply in host

Map onto existing multitasking chrome (`data-multitask`, `AVPictureInPictureController`, `requestPictureInPicture`). Do not turn a video element into this pack. Do not inject a kit. Do not invent a `visibilitychange` listener, `.pause()`, or a notification.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `scenePhase` / PiP handling, not a new pause kit |
| UIKit | Existing background and interruption observers, not invented pause chrome |
| AppKit | Existing window occlusion / space switching, not a fake iPhone switcher |
| Web | An existing `data-multitask` session, not every `<video>` |

## Checklist

- [ ] Dedicated multitasking or PiP chrome exists before this pack applies
- [ ] Attention-requiring activity pauses when people switch away
- [ ] Routine background work does not notify
- [ ] Primary audio interruptions pause playback
- [ ] A video element is not treated as this widget
