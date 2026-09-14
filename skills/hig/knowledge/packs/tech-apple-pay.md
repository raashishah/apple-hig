# tech-apple-pay

**Apple:** https://developer.apple.com/design/human-interface-guidelines/apple-pay  
**Gate:** `capability:applepay` (Apple Pay entitlement / PassKit payments — **not** `requiredIds`)  
**Also live-link (do not pack artwork):** [Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet), [Tap to Pay on iPhone](https://developer.apple.com/design/human-interface-guidelines/tap-to-pay-on-iphone), [In-app purchase](https://developer.apple.com/design/human-interface-guidelines/in-app-purchase)

Official button assets and payment-sheet chrome. Do **not** complete Pay or biometrics.

## Human-only

Never finish Apple Pay payment sheets, card selection, billing address, Face ID / Touch ID confirmation, or merchant capture. Style chrome **around** the system sheet. Do not automate payment. Do not ask the host user to pay.

## Apple guidance (invariants)

- Apple Pay is a secure way to pay for physical goods and services, donations, and subscriptions in apps and in browsers.
- Use **official** Apple Pay button / mark (`PKPaymentButton`, `Pay with Apple Pay`). Do not draw a custom Apple Pay button or mark.
- Present the **system** payment sheet. Do not restyle it, overlay it, or add extra steps that delay the sheet.
- Order lines and totals on the sheet must match what the person is buying.
- Apple Pay is a **payment method**, not an identity provider (that is Sign in with Apple).
- Digital goods that App Store rules send through In-App Purchase stay on IAP — live-link that page; do not fake Apple Pay for those SKUs.

## Do

- Official black / white / white-outline button per contrast on the surrounding surface.
- One Apple Pay action that presents the sheet; host chrome stays quiet behind it.
- Web: Apple Pay JS / Payment Request with official button; still human-only to complete.

## Don't

- Custom “Pay” pills that look like Apple Pay without the official asset.
- Complete or screenshot-walk the payment sheet as an apply step.
- Dump Wallet pass designer pixels into this pack.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `PayWithApplePayButton` / PassKit; unmodified `PKPaymentAuthorization` UI |
| UIKit | `PKPaymentButton` + `PKPaymentAuthorizationViewController` |
| Web | Official Apple Pay button + Payment Request; never a fake mark |
| CSS / brand fixtures | **Skip** |
