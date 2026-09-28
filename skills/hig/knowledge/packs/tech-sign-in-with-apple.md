# tech-sign-in-with-apple

**Apple:** [Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)  
**Surface id (later):** `sign-in-with-apple`  
**Compose with:** packed managing-accounts when the same chrome already exists; do not treat a password field, packed Apple Pay, or a bare Sign in with Apple phrase as this pack  
**Gate (later):** `always` when the host has Sign in with Apple chrome (`SignInWithAppleButton`, `ASAuthorizationAppleIDButton`, `data-siwa`); skip otherwise

Sign in with Apple does not ask for a password, does not ask for a personal email when a private relay address is used, and does not draw a custom Apple logo. Do not invent Sign in with Apple. Do not complete the system sign-in sheet. Do not map this pack onto packed managing-accounts or packed Apple Pay.

## Apple guidance (1:1)

- Don't ask people to supply a password. A key benefit of Sign in with Apple is that people don't have to create and memorize additional passwords.
- Avoid asking for a personal email address when people supply a private relay address. Respect that choice.
- Use only the logo artwork downloaded from Apple Design Resources; never create a custom Apple logo.
- Account-required-before-use, buried deletion, and the term passcode stay on packed managing-accounts. Payment marks stay on packed Apple Pay.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A password asked for alongside Sign in with Apple.
- A personal email asked for when a private relay address is used.
- A custom Apple logo on the Sign in with Apple button.

## Apply in host

Map onto existing Sign in with Apple chrome (`SignInWithAppleButton`, `ASAuthorizationAppleIDButton`, `data-siwa`). Do not invent a button, a password field, or a logo. Do not complete Sign in, Hide My Email, or biometrics. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `SignInWithAppleButton` when it already exists, not a custom Apple logo |
| UIKit | `ASAuthorizationAppleIDButton` when it already exists |
| AppKit | Existing Sign in with Apple chrome when it already exists |
| Web | Existing `data-siwa`, not packed managing-accounts or a generic Sign in label |

## Checklist

- [ ] A real Sign in with Apple widget exists before this pack applies
- [ ] The host does not ask for a password alongside Sign in with Apple
- [ ] The host does not ask for a personal email when a private relay address is used
- [ ] The button does not use a custom Apple logo
- [ ] Packed managing-accounts and packed Apple Pay stay themselves
