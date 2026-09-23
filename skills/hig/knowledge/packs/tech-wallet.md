# tech-wallet

**Apple:** [Wallet](https://developer.apple.com/design/human-interface-guidelines/wallet)  
**Gate:** `capability:wallet` on surface `wallet`. Unknown hosts skip. Skip-unless affordance `walletpass` (`data-wallet`). `import PassKit` and `PKPass` are the capability, not the widget. Apple Pay stays on surface `apple-pay`. Do not complete an Add to Wallet sheet.

A pass can update with a change message. That message is for a real change, not a promotion. The first suggestion to add a pass stays allowed. Logo artwork on the pass does not carry an inner drop shadow. A strip image does not contain baked-in text. Do not complete an Add to Wallet sheet. Do not invent a logo. Do not rewrite a strip image.

## Do

- Keep a pass up to date when the underlying fact changes.
- Put essential details where every device can show them.

## Don't

- A change message used for marketing.
- Asking again after people decline a Wallet suggestion.
- Inner drop shadows on logo artwork.
- Text embedded in the strip image.
- Duplicate notifications on a Wallet pass.
