# patterns-live-viewing-apps

**Apple:** [Live-viewing apps](https://developer.apple.com/design/human-interface-guidelines/live-viewing-apps)  
**Surface id (later):** `live-viewing-apps`  
**Compose with:** packed playing-video and packed multitasking when the same chrome already exists; do not treat every `<video>`, Picture in Picture, or packed playing-video as this pack  
**Gate (later):** `always` when the host has dedicated live-viewing chrome (`data-live-viewing`); skip otherwise

Live-viewing chrome marks live content as live and stops audio when people leave the live tab. Do not invent a live badge. Do not map this pack onto every `<video>` or packed playing-video. Mixed-audio-on-mode-switch stays on packed multitasking.

## Apple guidance (1:1)

- Feature live content prominently and make it easy to access. People need to distinguish live content from video-on-demand at a glance.
- Make sure live content looks live. Playing it is best; a badge, symbol, or sash can also mark it.
- When people navigate away from the live tab, they leave the live-viewing context, so audio needs to stop.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Live content that is not distinguished from video-on-demand.
- Audio that continues after leaving the live tab.

## Apply in host

Map onto existing live-viewing chrome (`data-live-viewing`). Do not invent a live badge, a Watch Now control, or an EPG. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing live-tab chrome, not every `VideoPlayer` |
| UIKit | Existing live-tab chrome, not every `AVPlayer` |
| AppKit | Existing live-tab chrome when it already exists |
| Web | Existing `data-live-viewing`, not every `<video>` |

## Checklist

- [ ] Dedicated live-viewing chrome exists before this pack applies
- [ ] Live content is distinguished from video-on-demand
- [ ] Audio stops when people leave the live tab
- [ ] Every `<video>` and packed playing-video stay themselves
