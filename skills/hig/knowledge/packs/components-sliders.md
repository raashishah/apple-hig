# components-sliders

**Apple:** [Sliders](https://developer.apple.com/design/human-interface-guidelines/sliders)  
**Also:** [Playing audio](https://developer.apple.com/design/human-interface-guidelines/playing-audio)  
**Surface id (later):** `sliders`  
**Compose with:** required `controls` when the same fields are leased  
**Gate (later):** `always` when the host has a continuous-value slider; skip otherwise

A slider is a track with a thumb between a minimum and a maximum. Do not invent a slider. Do not map this pack onto a picker, stepper, or progress bar.

## Apple guidance (1:1)

- Fill the track between the minimum value and the thumb as the value changes. Optional leading/trailing icons can illustrate min and max.
- Customize track color, thumb, and icons when that communicates intent (for example small/large image icons around an image-size slider).
- Familiar directions: min on the leading side and max on the trailing side (horizontal); min at the bottom and max at the top (vertical).
- Wide ranges may pair the slider with a text field and a stepper so people can type or increment an exact value.
- Audio output volume is not a custom slider. Use the system volume view, which includes a volume-level slider and a control for changing the active audio output.

## Don't

- Don't use a slider to adjust audio volume.

## Apply in host

Use the host slider. Do not inject a kit. Do not invent a volume view the host does not have.

| Host | Prefer |
|---|---|
| SwiftUI | `Slider` for in-app values; system volume view for audio output |
| UIKit | `UISlider`; system volume view for audio output |
| AppKit | `NSSlider` |
| Web | Native `<input type="range">` / `role="slider"`; 44px phone targets |

## Checklist

- [ ] Slider exists only when the host already has one
- [ ] Audio output volume is not a custom slider
- [ ] Min/max sit on the familiar sides
- [ ] Wide ranges can show an exact value
