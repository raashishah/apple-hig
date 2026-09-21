# patterns-playing-video

**Apple:** [Playing video](https://developer.apple.com/design/human-interface-guidelines/playing-video)  
**Surface id (later):** `playing-video`  
**Compose with:** packed going-full-screen and packed multitasking when the same chrome already exists; do not treat `100vh`, Picture in Picture chrome, or mixed-audio-on-mode-switch as this pack  
**Gate (later):** `always` when the host has a video player (`<video>`, `AVPlayer`, `VideoPlayer(`, `data-video-player`); skip otherwise

A video player presents playback with the system player, original aspect ratio, and no resume or splash barrier. Do not invent a player. Do not map this pack onto `100vh`, packed going-full-screen, or packed multitasking. Mixed audio when switching modes stays on packed multitasking.

## Apple guidance (1:1)

- Use the system video player. A custom experience that diverges from the system-provided player causes frustration.
- Always display video content at its original aspect ratio. Do not embed letterbox or pillarbox padding in the video frame.
- Avoid asking people if they want to resume playback. Resume automatically when playback can continue.
- Avoid displaying loading screens, splash screens, detail screens, or intro animations before play.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A custom video player that diverges from the system player.
- Video displayed with embedded letterbox or pillarbox padding.
- Asking people if they want to resume playback.
- A loading or splash screen before video playback.

## Apply in host

Map onto an existing video player (`<video>`, `AVPlayer`, `VideoPlayer(`, `data-video-player`). Do not invent a player, autoplay, or a Space handler. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `VideoPlayer` / `AVPlayer`, not a custom transport |
| UIKit | `AVPlayerViewController`, not a custom player chrome |
| AppKit | System player, not a custom frame around the video |
| Web | An existing `<video>` / `data-video-player`, not `100vh` |

## Checklist

- [ ] A real video player exists before this pack applies
- [ ] The player does not diverge from the system player
- [ ] Video keeps its original aspect ratio
- [ ] Resume is not a prompt
- [ ] Playback is not behind a loading or splash screen
- [ ] `100vh` and Picture in Picture chrome stay themselves
