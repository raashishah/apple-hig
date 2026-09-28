# tech-shareplay

**Apple:** [SharePlay](https://developer.apple.com/design/human-interface-guidelines/shareplay)  
**Surface id (later):** `shareplay`  
**Compose with:** packed activity-views and packed multitasking when the same chrome already exists; do not treat a Share control, packed activity-views, or Picture in Picture as this pack  
**Gate (later):** `always` when the host has SharePlay chrome (`GroupActivity`, `GroupSession`, `ActivitySharingView`, `data-shareplay`); skip otherwise

SharePlay is a real-time shared activity. The term stays SharePlay; it is not paired with an adjective and is not inflected. Do not invent SharePlay. Do not map this pack onto a Share control or packed activity-views.

## Apple guidance (1:1)

- Use the term SharePlay correctly. You can use SharePlay as a noun, as in "Join SharePlay," or as a verb that describes an action in your interface, like a SharePlay Movie button. Don't pair SharePlay with an adjective. In a visionOS app, for instance, avoid adding terms like virtual or spatial. And don't alter the term itself with variations like SharePlayed, SharePlays, or SharePlaying.
- Picture in Picture for shared video stays on packed multitasking.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- SharePlay paired with an adjective.
- SharePlayed, SharePlays, or SharePlaying.

## Apply in host

Map onto existing SharePlay chrome (`GroupActivity`, `GroupSession`, `ActivitySharingView`, `data-shareplay`). Do not invent SharePlay, rewrite brand copy, or inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `GroupActivity` / `ActivitySharingView`, not a custom Share overlay |
| UIKit | Existing Group Activities chrome when it already exists |
| AppKit | Existing Group Activities chrome when it already exists |
| Web | Existing `data-shareplay`, not a Share button |

## Checklist

- [ ] A real SharePlay widget exists before this pack applies
- [ ] SharePlay is not paired with an adjective
- [ ] SharePlayed, SharePlays, and SharePlaying are not used
- [ ] A Share control and packed activity-views stay themselves
