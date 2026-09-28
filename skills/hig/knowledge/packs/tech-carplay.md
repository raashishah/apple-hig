# tech-carplay

**Apple:** [CarPlay](https://developer.apple.com/design/human-interface-guidelines/carplay)  
**Surface id (later):** `carplay`  
**Compose with:** packed maps when the same chrome already exists; do not treat packed maps, a generic CarPlay phrase, or an iframe as this pack  
**Gate (later):** `always` when the host has CarPlay chrome (`CPInterfaceController`, `CPTemplateApplicationScene`, `data-carplay`); skip otherwise

CarPlay does not lock people out because iPhone needs input, does not report errors on iPhone, and does not require iPhone interactions while CarPlay is active. Do not invent CarPlay. Do not complete vehicle pairing. Do not map this pack onto packed maps.

## Apple guidance (1:1)

- Never lock people out of CarPlay because the connected iPhone requires input. If people must resolve a problem on the connected iPhone, let them do so after the vehicle stops.
- Report errors in CarPlay, not on the connected iPhone. Never direct people to pick up their iPhone to read or resolve an error.
- Eliminate app interactions on iPhone when CarPlay is active. If your app requires setup on iPhone, make sure people perform it before the vehicle is in motion.
- Maps legal-link and indoor-replica Don'ts stay on packed maps. Autoplay Don'ts stay on packed playing-video. Volume Don'ts stay on packed sliders.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- CarPlay locked out because iPhone requires input.
- Errors reported on iPhone instead of CarPlay.
- iPhone interactions required while CarPlay is active.

## Apply in host

Map onto existing CarPlay chrome (`CPInterfaceController`, `CPTemplateApplicationScene`, `data-carplay`). Do not invent CarPlay, a driving template, or an iPhone lock sheet. Do not complete vehicle pairing. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing CarPlay scene chrome when it already exists, not a custom driving replica |
| UIKit | `CPInterfaceController` / `CPTemplateApplicationScene` when they already exist |
| AppKit | Existing CarPlay chrome when it already exists |
| Web | Existing `data-carplay`, not packed maps or a generic CarPlay label |

## Checklist

- [ ] A real CarPlay widget exists before this pack applies
- [ ] CarPlay is not locked out because iPhone requires input
- [ ] Errors are not reported on iPhone instead of CarPlay
- [ ] iPhone interactions are not required while CarPlay is active
- [ ] Packed maps stay themselves
