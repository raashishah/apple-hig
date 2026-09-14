# tech-cluster-commerce

**Gate:** `capability:iap` / `capability:wallet` / `capability:taptopay` / `capability:nfc` / `capability:idverifier` — **not** `requiredIds`  
**Kind:** live-link cluster  
**Related encoded pack:** `tech-apple-pay.md` (official Pay button only)

## Human-only

Never complete In-App Purchase, Wallet add-to-wallet, Tap to Pay, NFC reads, or ID Verifier capture. Never complete biometrics. Apply chrome around system sheets only.

## Live Apple pages

- [In-app purchase](https://developer.apple.com/design/human-interface-guidelines/in-app-purchase)
- [Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)
- [Tap to Pay on iPhone](https://developer.apple.com/design/human-interface-guidelines/tap-to-pay-on-iphone)
- [NFC](https://developer.apple.com/design/human-interface-guidelines/nfc)
- [ID Verifier](https://developer.apple.com/design/human-interface-guidelines/id-verifier)

## Apply stance

StoreKit / PassKit / Tap to Pay / NFC / ID Verifier UI is system. Do not restyle purchase sheets. Do not pack pass artwork sizes. Web-css / brand **skip**.

## Don't

- Treat this cluster as a license to finish Apple Pay (that pack is human-only too).
