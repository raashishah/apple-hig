# patterns-playing-haptics

**Apple:** [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics)  
**Surface id (later):** `playing-haptics`  
**Compose with:** packed feedback when the same chrome already exists; do not treat a button tap, a slider, or packed playing-video as this pack  
**Gate (later):** `always` when the host has a haptic API (`UIFeedbackGenerator`, `CHHapticEngine`, `navigator.vibrate`, `data-haptic`); skip otherwise

Haptics complement discrete events with system patterns, used sparingly, and remain optional. Do not invent Core Haptics. Do not map this pack onto a button, a slider, or packed playing-video.

## Apple guidance (1:1)

- Use system-provided haptic patterns according to their documented meanings. Do not use a pattern to mean something else.
- Avoid overusing haptics. Prefer short haptics that complement discrete events.
- Make haptics optional. Let people turn off or mute haptics, and make sure people can still enjoy the app without them.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A system haptic pattern used to mean something else.
- Overused haptics.
- Haptics with no way to turn them off.

## Apply in host

Map onto an existing haptic API (`UIFeedbackGenerator`, `CHHapticEngine`, `navigator.vibrate`, `data-haptic`). Do not invent Core Haptics or a mute toggle. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `.sensoryFeedback` / feedback generators, not a custom always-on rumble |
| UIKit | `UIFeedbackGenerator` families, not a reused notification haptic for a hit |
| AppKit | Force Touch trackpad haptics when they already exist |
| Web | Existing `navigator.vibrate` / `data-haptic`, not a CSS shake |

## Checklist

- [ ] A real haptic API exists before this pack applies
- [ ] System patterns keep their documented meaning
- [ ] Haptics are not overused
- [ ] People can turn haptics off
- [ ] A button tap is not treated as this widget
