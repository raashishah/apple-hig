# tech-apple-pay

**Apple:** [Apple Pay](https://developer.apple.com/design/human-interface-guidelines/apple-pay)  
**Surface id (later):** `apple-pay`  
**Compose with:** packed managing-accounts when the same chrome already exists; do not treat packed Wallet, packed Tap to Pay, packed NFC, packed In-App Purchase, or a bare Apple Pay phrase as this pack  
**Gate (later):** `capability:applepay` when the host has Apple Pay chrome (`PKPaymentButton`, `PayWithApplePayButton`, `data-apple-pay`); skip otherwise. Do not overlay `always`. A PassKit wallet host is not Apple Pay.

Apple Pay does not use the Apple Pay mark as a payment button, does not make Apple Pay plural or possessive, and does not replace the word Apple with the Apple logo. Do not invent Apple Pay. Do not complete the payment sheet. Do not map this pack onto packed Wallet.

## Apple guidance (1:1)

- Use the Apple Pay mark only to communicate that Apple Pay is accepted. Never use the mark as a payment button or position it as a button.
- Use Apple Pay exactly as shown in the Apple trademark list. Never make it plural or possessive.
- Never use the Apple logo to represent the name Apple in text.
- Wallet pass chrome stays on packed Wallet. Tap to Pay, NFC, and In-App Purchase stay themselves. Account-required-before-use stays on packed managing-accounts.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- The Apple Pay mark used as a payment button.
- Apple Pay made plural or possessive.
- The Apple logo used in place of the word Apple.

## Apply in host

Map onto existing Apple Pay chrome (`PKPaymentButton`, `PayWithApplePayButton`, `data-apple-pay`). Do not invent a payment sheet, a mark, or a logo. Do not complete Apple Pay or biometrics. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `PayWithApplePayButton` when it already exists, not a mark drawn as a button |
| UIKit | `PKPaymentButton` when it already exists |
| AppKit | Existing Apple Pay chrome when it already exists |
| Web | Existing `data-apple-pay`, not packed Wallet or a generic Pay label |

## Checklist

- [ ] A real Apple Pay widget exists before this pack applies
- [ ] The Apple Pay mark is not used as a payment button
- [ ] Copy does not make Apple Pay plural or possessive
- [ ] The Apple logo does not stand in for the word Apple
- [ ] Packed Wallet, packed Tap to Pay, packed NFC, and packed In-App Purchase stay themselves
