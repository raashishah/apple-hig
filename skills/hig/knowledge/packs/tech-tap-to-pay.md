# tech-tap-to-pay

**Apple:** [Tap to Pay on iPhone](https://developer.apple.com/design/human-interface-guidelines/tap-to-pay-on-iphone)  
**Surface id (later):** `tap-to-pay-on-iphone`  
**Compose with:** packed nfc and packed apple-pay when the same chrome already exists; do not treat NFC, Wallet, or packed Apple Pay as this pack  
**Gate (later):** `always` when the host has Tap to Pay chrome (`ProximityReader`, `PaymentCardReader`, `data-tap-to-pay`); skip otherwise

Tap to Pay buttons do not include the Apple logo, and they do not say Tap to Pay or Tap to Pay on iPhone on a Look Up, Store Card, Verify, Refund, or loyalty action. Do not invent Tap to Pay. Do not complete a payment. Do not map this pack onto NFC or packed Apple Pay.

## Apple guidance (1:1)

- Always avoid including the Apple logo in Tap to Pay on iPhone buttons.
- Use a generic label in a button that opens the Tap to Pay on iPhone screen to read a payment card when there's no transaction amount. Don't include "Tap to Pay on iPhone" or "Tap to Pay" in such a label; instead, use a generic label like "Look Up," "Store Card," "Verify," or "Refund."
- If your app supports an independent loyalty card transaction, distinguish this flow from a payment-acceptance flow. Avoid including "Tap to Pay on iPhone," "Tap to Pay," or other payment-related terms in the label for a loyalty-transaction button.
- Completing a tap stays human-only. This pack does not invent a payment sheet or finish a transaction.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Apple logo in a Tap to Pay button.
- Tap to Pay or Tap to Pay on iPhone on a Look Up, Store Card, Verify, Refund, or loyalty button.

## Apply in host

Map onto existing Tap to Pay chrome (`ProximityReader`, `PaymentCardReader`, `PaymentCardReaderSession`, `data-tap-to-pay`). Do not invent Tap to Pay, a payment sheet, or rewritten button labels. Do not complete a payment. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing ProximityReader chrome when it already exists, not a custom Apple-logo Pay overlay |
| UIKit | `ProximityReader` / `PaymentCardReader` when they already exist |
| AppKit | Not supported on Mac; skip unless the host already has this chrome |
| Web | Existing `data-tap-to-pay`, not NFC or packed Apple Pay |

## Checklist

- [ ] A real Tap to Pay widget exists before this pack applies
- [ ] The Tap to Pay button does not include the Apple logo
- [ ] Look Up, Store Card, Verify, Refund, and loyalty actions do not say Tap to Pay
- [ ] NFC, Wallet, and packed Apple Pay stay themselves
