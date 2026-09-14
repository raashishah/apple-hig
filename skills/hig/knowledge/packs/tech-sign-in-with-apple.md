# tech-sign-in-with-apple

**Apple:** https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple  
**Gate:** `capability:signinwithapple` (entitlement / Sign in with Apple capability — **not** `requiredIds`)  
**Compose with:** patterns-forms, foundations-privacy (when packed)

Legal/UX invariants only. Do not reprint button artwork. Do **not** complete Sign in or biometrics.

## Human-only

Never finish Sign in with Apple consent, Hide My Email, two-factor, Face ID / Touch ID / Optic ID, or passkey sheets. Style chrome **around** system UI. Do not automate those flows. Do not ask the host user to complete them.

## Apple guidance (invariants)

- Sign in with Apple is a fast, private way to sign into apps and websites.
- If the product offers third-party sign-in, **Sign in with Apple is an equivalent option** — same screen, same visual weight, not buried in “more”.
- Use **official** Sign in with Apple button assets / `SignInWithAppleButton`. Do not invent a lookalike or use the Apple logo as decoration.
- Do not collect extra personal data beyond what the product needs after Apple returns identity.
- Respect Hide My Email / private relay. Do not force a “real” email as a second gate.
- Re-auth uses **system** biometrics or device passcode. Do not fake Face ID chrome.
- Existing accounts can link; do not trap people in a duplicate identity.

## Do

- Place the official button with other sign-in methods, equal prominence.
- Keep cancel available on the host screen that presents the system sheet.
- Web: official Apple JS button, not a custom “Continue with Apple” sketch.

## Don't

- Hide Sign in with Apple behind a third-party-only menu when Guideline 4.8 applies.
- Restyle or screenshot-complete the system authorization sheet.
- Route voice / shortcut work to `tech-siri-app-shortcuts.md`. This pack is authentication only.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `SignInWithAppleButton`; AuthenticationServices; present system UI unmodified |
| UIKit | `ASAuthorizationAppleIDButton` + `ASAuthorizationController` |
| Web | Apple JS SDK button on the same sign-in surface as other providers |
| CSS / brand fixtures | **Skip** unless the host actually ships Sign in with Apple |
