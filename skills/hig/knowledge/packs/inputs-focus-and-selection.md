# inputs-focus-and-selection

**Apple:** [Focus and selection](https://developer.apple.com/design/human-interface-guidelines/focus-and-selection)  
**Also:** [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards)  
**Surface id (later):** `focus-and-selection`  
**Compose with:** required lists/search when the same row is focused; do not treat `:focus` CSS, `tabindex`, or `autofocus` alone as this widget  
**Gate (later):** `always` when the host has a dedicated focus system; skip otherwise

Focus helps people visually confirm the object that their interaction targets. Not supported on iOS or watchOS. Do not invent a focus ring. Do not map this pack onto every `:focus` rule, `tabindex`, or `autofocus` attribute.

## Apple guidance (1:1)

- Rely on system-provided focus effects. Consider custom focus effects only if it is absolutely necessary.
- Avoid changing focus without people's interaction. People rely on the focus system to know where they are. If a previously focused item disappears while they are moving with a keyboard, remote, or game controller, move focus to a nearby remaining item; otherwise hide the indicator.
- Use a focus ring for a text or search field, and a row highlight in a list or collection.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Focus changed without people's interaction.
- Custom focus effects that replace the system effect.

## Apply in host

Map onto an existing focus system (`UIFocusHaloEffect`, `focusGroupIdentifier`, `NSFocusRingType`, `data-focus-system`). Do not turn `:focus` CSS or `tabindex` into this pack. Do not inject a kit. Do not invent a ring or steal-focus rewrite beyond stripping markers.

| Host | Prefer |
|---|---|
| SwiftUI | System focus effects / focus groups, not a custom glow kit |
| UIKit | `UIFocusHaloEffect`, not a programmatic focus steal on appear |
| AppKit | System focus rings, not a custom outline that fights the system |
| Web | An existing `data-focus-system` / `data-focus-ring`, not every `:focus` rule |

## Checklist

- [ ] A real focus system exists before this pack applies
- [ ] Focus does not move without people's interaction
- [ ] System focus effects stay
- [ ] `:focus` CSS, `tabindex`, and `autofocus` alone are not treated as this widget
