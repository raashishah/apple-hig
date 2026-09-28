# tech-in-app-purchase

**Apple:** [In-app purchase](https://developer.apple.com/design/human-interface-guidelines/in-app-purchase)  
**Surface id (later):** `apple-in-app-purchase`  
**Compose with:** packed apple-pay, packed tap-to-pay, and packed id-verifier when the same chrome already exists; do not treat Apple Pay, Tap to Pay, Wallet, or ID Verifier as this pack  
**Gate (later):** `always` when the host has In-App Purchase chrome (`StoreKit`, `SKPaymentQueue`, `data-in-app-purchase`); skip otherwise

In-App Purchase uses the system confirmation sheet, keeps Request a Refund reachable without a scroll or extra screen, and does not characterize Apple refund policies. Do not invent IAP. Do not complete a purchase. Do not map this pack onto packed Apple Pay, Tap to Pay, or ID Verifier.

## Apple guidance (1:1)

- Use the default confirmation sheet. When someone initiates an in-app purchase, the system displays a confirmation sheet to help prevent accidental purchases. Don't modify or replicate this sheet.
- Make it easy for people to request a refund. Avoid making people scroll or open another screen to reveal your refund-request button.
- Avoid characterizing or providing guidance on Apple's refund policies. For example, don't speculate about whether customers will receive the refund they request.
- Completing a purchase stays human-only. This pack does not invent a payment sheet or finish a transaction.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Modified or replicated system confirmation sheet.
- Refund-request button hidden behind a scroll or extra screen.
- Apple refund policies characterized in user-facing copy.

## Apply in host

Map onto existing In-App Purchase chrome (`StoreKit`, `SKPaymentQueue`, `Product.purchase`, `data-in-app-purchase`). Do not invent IAP, a confirmation sheet, or rewritten refund copy. Do not complete a purchase. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing StoreKit confirmation chrome when it already exists, not a custom replica sheet |
| UIKit | `StoreKit` / `SKPaymentQueue` when they already exist |
| AppKit | Existing StoreKit chrome when it already exists |
| Web | Existing `data-in-app-purchase`, not packed Apple Pay, Tap to Pay, or ID Verifier |

## Checklist

- [ ] A real In-App Purchase widget exists before this pack applies
- [ ] The host does not ship a replica confirmation sheet
- [ ] Request a Refund is not hidden behind a scroll or extra screen
- [ ] User-facing copy does not characterize Apple refund policies
- [ ] Packed Apple Pay, Tap to Pay, Wallet, and ID Verifier stay themselves
