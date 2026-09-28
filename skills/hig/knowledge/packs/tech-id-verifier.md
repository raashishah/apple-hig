# tech-id-verifier

**Apple:** [ID Verifier](https://developer.apple.com/design/human-interface-guidelines/id-verifier)  
**Surface id (later):** `id-verifier`  
**Compose with:** packed nfc, packed tap-to-pay, and packed apple-pay when the same chrome already exists; do not treat NFC, Tap to Pay, Wallet, or packed Apple Pay as this pack  
**Gate (later):** `always` when the host has ID Verifier chrome (`MobileDriversLicenseDisplayRequest`, `MobileDriversLicenseDataRequest`, `data-id-verifier`); skip otherwise

ID Verifier buttons do not include the Apple logo, and they do not include an NFC or QR communication symbol. Do not invent ID Verifier. Do not complete a verification. Do not map this pack onto NFC, Tap to Pay, or packed Apple Pay.

## Apple guidance (1:1)

- Provide a button that initiates the verification process. Use a label like Verify Age in a button that performs a simple age check or Verify Identity for a more detailed identity data request. Avoid including a symbol that specifies a particular type of communication, like NFC or QR codes. Never include the Apple logo in any button label.
- Completing a verification stays human-only. This pack does not invent a verification sheet or finish a read.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Apple logo in an ID Verifier button.
- NFC or QR communication symbol on a Verify Age or Verify Identity button.

## Apply in host

Map onto existing ID Verifier chrome (`MobileDriversLicenseDisplayRequest`, `MobileDriversLicenseDataRequest`, `MobileDriversLicenseRawDataRequest`, `data-id-verifier`). Do not invent ID Verifier, a verification sheet, or rewritten button labels. Do not complete a verification. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing MobileDriversLicenseDisplayRequest chrome when it already exists, not a custom Apple-logo Verify overlay |
| UIKit | `MobileDriversLicenseDisplayRequest` / `MobileDriversLicenseDataRequest` when they already exist |
| AppKit | Not supported on Mac; skip unless the host already has this chrome |
| Web | Existing `data-id-verifier`, not NFC, Tap to Pay, or packed Apple Pay |

## Checklist

- [ ] A real ID Verifier widget exists before this pack applies
- [ ] The ID Verifier button does not include the Apple logo
- [ ] Verify Age and Verify Identity actions do not include an NFC or QR communication symbol
- [ ] NFC, Tap to Pay, Wallet, and packed Apple Pay stay themselves
