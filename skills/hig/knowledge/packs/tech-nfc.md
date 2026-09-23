# tech-nfc

**Apple:** [NFC](https://developer.apple.com/design/human-interface-guidelines/nfc)  
**Surface id (later):** `nfc`  
**Compose with:** packed nearby-interactions when the same chrome already exists; do not treat Nearby Interaction, Wallet, Tap to Pay, or packed Apple Pay as this pack  
**Gate (later):** `always` when the host has NFC chrome (`NFCNDEFReaderSession`, `NFCTagReaderSession`, `data-nfc`); skip otherwise

NFC scanning asks people to scan or hold near an object. It does not tell them to tap or touch, and it does not say NFC, Core NFC, Near-field communication, or NFC tag. Do not invent NFC. Do not complete an NFC read. Do not map this pack onto Nearby Interaction or a Share control.

## Apple guidance (1:1)

- Don't encourage people to make contact with physical objects. To scan a tag, an iOS device must simply be within close proximity of the tag. It doesn't need to actually touch the tag. Use terms like scan and hold near instead of tap and touch when asking people to scan objects.
- Use approachable terminology. Avoid referring to technical, developer-oriented terms like NFC, Core NFC, Near-field communication, and tag. Use friendly, conversational terms that most people will understand.
- Background-and-in-app reading stays a host capability. This pack does not invent a scanning sheet.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Tap or touch used to ask people to scan.
- NFC, Core NFC, Near-field communication, or NFC tag in user-facing copy.

## Apply in host

Map onto existing NFC chrome (`NFCNDEFReaderSession`, `NFCTagReaderSession`, `NFCReaderSession`, `CoreNFC`, `data-nfc`). Do not invent NFC, a scanning sheet, or rewritten scan copy. Do not complete an NFC read. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing Core NFC session chrome when it already exists, not a custom tap overlay |
| UIKit | `NFCNDEFReaderSession` / `NFCTagReaderSession` when they already exist |
| AppKit | Not supported on Mac; skip unless the host already has this chrome |
| Web | Existing `data-nfc`, not Nearby Interaction or a Share button |

## Checklist

- [ ] A real NFC widget exists before this pack applies
- [ ] Scan instructions do not say tap or touch
- [ ] User-facing copy does not say NFC, Core NFC, Near-field communication, or NFC tag
- [ ] Nearby Interaction, Wallet, and Tap to Pay stay themselves
