# patterns-managing-accounts

**Apple:** [Managing accounts](https://developer.apple.com/design/human-interface-guidelines/managing-accounts)  
**Also:** [Sign in with Apple](https://developer.apple.com/design/human-interface-guidelines/sign-in-with-apple)  
**Surface id (later):** `managing-accounts`  
**Compose with:** required forms when the same fields collect credentials; do not treat a data-entry form, Settings, a password field, or Sign in with Apple consent as this widget  
**Gate (later):** `always` when the host has dedicated account or sign-in chrome; skip otherwise

An account is useful when core functionality needs it. Delay sign-in otherwise. Face ID, Touch ID, and Sign in with Apple consent stay human-only. Do not invent an account wall. Do not map this pack onto a form, Settings, `type=password`, or the system Sign in with Apple sheet.

## Apple guidance (1:1)

- Ask people to create an account only if core functionality requires it; otherwise let them use the app without one.
- Delay sign-in for as long as possible. People often abandon apps that force sign-in before anything useful.
- If the app helps people create an account, it must also help them delete it, not just deactivate it. Do not bury that path in Privacy Policy or Terms of Service.
- Avoid using the term passcode to refer to account authentication. People create a passcode to unlock a device or authenticate for Apple services.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- An account required before people can use the app, instead of delaying sign-in.
- Account deletion buried in Privacy Policy or Terms.
- The term passcode used for account authentication.

## Apply in host

Map onto existing account or sign-in chrome (`data-account`, `data-sign-in`). Do not turn a form, Settings, a password field, or Sign in with Apple into this pack. Do not inject a kit. Do not invent a guest path, a deletion flow, or Face ID.

| Host | Prefer |
|---|---|
| SwiftUI | Existing sign-in chrome; delay the wall; system Sign in with Apple stays unmodified |
| UIKit | Existing account screens, not a first-launch gate |
| AppKit | Existing account windows, not a passcode prompt for app login |
| Web | An existing `data-account` / `data-sign-in` screen, not every form or password input |

## Checklist

- [ ] A real account or sign-in screen exists before this pack applies
- [ ] Sign-in is delayed until it is required
- [ ] Account deletion is not buried in Privacy Policy or Terms
- [ ] Account authentication does not say passcode
- [ ] A form, Settings, a password field, and Sign in with Apple are not treated as this widget
