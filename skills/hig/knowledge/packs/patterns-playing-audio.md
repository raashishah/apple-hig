# patterns-playing-audio

**Apple:** [Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)  
**Surface id (later):** `playing-audio`  
**Compose with:** packed sliders and packed playing-video when the same chrome already exists; do not treat a volume slider, a video element, packed AirPlay, or a bare audio word as this pack  
**Gate (later):** `always` when the host has playing-audio chrome (`AVAudioSession`, `MPNowPlayingInfoCenter`, `data-playing-audio`); skip otherwise

Playing audio does not set the system output volume, does not repurpose audio controls, and pauses when headphones disconnect. Do not invent a player. Do not map this pack onto a volume slider, packed playing-video, or packed AirPlay. Mixed audio when switching modes stays on packed multitasking.

## Apple guidance (1:1)

- Adjust relative levels when you need a mix. Do not adjust the overall volume. The system volume always governs the final output.
- Avoid repurposing audio controls. People expect those controls to mean the same thing in every app.
- When headphones disconnect, pause playback immediately.
- A slider used for audio volume stays on packed sliders. Video playback stays on packed playing-video. AirPlay routing stays on packed AirPlay.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- The app sets the system output volume.
- Audio controls repurposed for a non-playback action.
- Playback continues after headphones disconnect.

## Apply in host

Map onto existing playing-audio chrome (`AVAudioSession`, `MPNowPlayingInfoCenter`, `data-playing-audio`). Do not invent a player, a volume view, or a headphone sheet. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `AVAudioSession` chrome when it already exists, not a custom volume owner |
| UIKit | `MPNowPlayingInfoCenter` when it already exists |
| AppKit | Existing audio-session chrome when it already exists |
| Web | Existing `data-playing-audio`, not a volume slider or a video element |

## Checklist

- [ ] A real playing-audio widget exists before this pack applies
- [ ] The app does not set the system output volume
- [ ] Audio controls are not repurposed for a non-playback action
- [ ] Playback does not continue after headphones disconnect
- [ ] A volume slider, a video element, and packed AirPlay stay themselves
