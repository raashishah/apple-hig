# tech-airplay

**Apple:** [AirPlay](https://developer.apple.com/design/human-interface-guidelines/airplay)  
**Surface id (later):** `airplay`  
**Compose with:** packed playing-video and packed multitasking when the same chrome already exists; do not treat every `<video>`, a Share control, or packed playing-video as this pack  
**Gate (later):** `always` when the host has AirPlay routing (`AVRoutePickerView`, `AirPlayButton`, `allowsAirPlayVideo`, `allowsExternalPlayback`, `data-airplay`); skip otherwise

AirPlay streams expected media to another device and keeps playing when the app backgrounds. Do not invent a route picker. Do not map this pack onto every `<video>` or a Share control. Prefer-system-player stays on packed playing-video. Mixed-audio-on-mode-switch stays on packed multitasking.

## Apple guidance (1:1)

- Stream only the content people expect. Avoid background loops and short clips that make sense only inside the app.
- Don't stop playback when the app enters the background or the device locks. People expect the show they started to keep streaming.
- Avoid automatic mirroring. People do not want other on-device content streamed without an explicit choice.
- Don't interrupt another app's playback unless starting immersive content. Launch and autoplay inline video stay on the local device.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- AirPlay playback that stops when the app backgrounds or the device locks.
- Interrupting another app's playback with non-immersive content.
- Automatic mirroring without an explicit choice.
- Streaming background loops or in-app-only clips.

## Apply in host

Map onto existing AirPlay routing (`AVRoutePickerView`, `AirPlayButton`, `allowsAirPlayVideo`, `allowsExternalPlayback`, `data-airplay`). Do not invent a route picker, ambient playback, or a keep-playing handler. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `AirPlayButton` / route picker, not a custom AirPlay control |
| UIKit | `AVRoutePickerView` / `allowsExternalPlayback`, not a custom route sheet |
| AppKit | Existing AirPlay routing when it already exists |
| Web | Existing `data-airplay`, not every `<video>` or a Share button |

## Checklist

- [ ] A real AirPlay control exists before this pack applies
- [ ] Playback does not stop when the app backgrounds or the device locks
- [ ] Autoplay inline video does not interrupt another app's stream
- [ ] Mirroring is not automatic
- [ ] Background loops and in-app-only clips are not streamed
- [ ] Every `<video>` and a Share control stay themselves
