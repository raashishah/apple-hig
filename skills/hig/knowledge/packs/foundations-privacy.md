# foundations-privacy

**Apple:** https://developer.apple.com/design/human-interface-guidelines/privacy  
**Phase:** 1

Encode permission **timing and copy**. Do not complete Apple Pay, Sign in with Apple, or biometric sheets for the user (those stay human-only).

## Apple guidance (durable)

- Ask for data or device access **when the feature needs it**, not at first launch as a bundle.
- Purpose strings and in-app explanation must match what the code actually uses.
- Be transparent about what is collected and how people can say no or later change it.
- Do not gate the whole app on a permission that only one feature needs.
- Protect data people already granted; do not leak it into logs, screenshots, or unrelated analytics.

## Do

- Pair each system prompt with a short, specific reason in product language.
- Offer a path that works (even if limited) when the person declines.
- Put ongoing access in Settings, not a sticky modal.

## Don't

- Dark-pattern “Allow” as the only readable control.
- Pre-emptive camera/mic/location prompts on a marketing screen.
- Rewriting or automating system permission, Pay, or Sign in UI.
- A custom tracking screen with an incentive or an Allow button.
- A Close or Cancel button on a custom tracking screen.

## Apply in host

| Host | How |
|---|---|
| SwiftUI / UIKit | Info.plist purpose keys + request APIs at the moment of use; in-app copy before the system sheet |
| Web / CSS | Browser permission prompts at feature use; no fake system sheets. Explain why before `getUserMedia` / geolocation |
| Mac | Same timing rules for TCC prompts; menu-bar apps must not harvest in the background without a clear job |

## Craft checklist

- [ ] No first-launch permission gauntlet
- [ ] Purpose text matches the feature
- [ ] Decline path exists
- [ ] Pay / Sign in / biometrics not auto-filled
