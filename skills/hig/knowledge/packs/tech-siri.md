# tech-siri

**Apple:** [Siri](https://developer.apple.com/design/human-interface-guidelines/siri)  
**Surface id (later):** `siri`  
**Compose with:** packed App Shortcuts when the same chrome already exists; do not treat packed App Shortcuts, packed snippets, packed inclusion, or a bare Siri / Hey Siri phrase as this pack  
**Gate (later):** `always` when the host has Siri chrome (`INInteraction`, `SiriKit`, `data-siri`); skip otherwise

Siri-delivered content does not advertise or pitch in-app purchase, does not impersonate Siri or use reserved phrases, and refers to Siri by name. Do not invent Siri. Do not map this pack onto packed App Shortcuts.

## Apple guidance (1:1)

- Don't advertise. Don't include advertisements, marketing, or in-app purchase sales pitches in content that Siri delivers.
- Never impersonate Siri, attempt to reproduce the functionality that Siri provides, or provide a response that appears to come from Apple. Don't use reserved phrases like "Call 911" or "Hey Siri."
- Refer to Siri by name. Don't reference Siri using pronouns like she, him, or her.
- Offensive language stays on packed inclusion. Spoken-dialogue snippet purpose stays on packed snippets. App Shortcuts title case stays on packed App Shortcuts.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Advertisements or IAP pitches in Siri-delivered content.
- Impersonated Siri or reserved phrases.
- Siri referred to with she, he, or her.

## Apply in host

Map onto existing Siri chrome (`INInteraction`, `SiriKit`, `data-siri`). Do not invent Siri, a Siri sheet, or App Intents. Do not complete Siri permission, voice enrollment, or Lock Screen auth. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing SiriKit / App Intents chrome when it already exists, not a custom Siri replica |
| UIKit | `INInteraction` / `SiriKit` when they already exist |
| AppKit | Existing Siri chrome when it already exists |
| Web | Existing `data-siri`, not packed App Shortcuts or a generic Siri label |

## Checklist

- [ ] A real Siri widget exists before this pack applies
- [ ] Siri-delivered content does not advertise or pitch IAP
- [ ] The host does not impersonate Siri or use reserved phrases
- [ ] Copy refers to Siri by name, not she / he / her
- [ ] Packed App Shortcuts and packed snippets stay themselves
