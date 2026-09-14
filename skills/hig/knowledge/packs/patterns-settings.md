# patterns-settings

**Apple:** [Settings](https://developer.apple.com/design/human-interface-guidelines/settings)

Own surface: in-app Settings / Preferences / a dedicated settings route leases those files. Do not fold into always-on `forms` (that pack is data entry). Do not steal `controls` leases on every toggle elsewhere.

**Skip unless** the host has a settings, preferences, or account-options screen.

## Apple guidance (1:1)

- Apps should just work. Settings exist for real preferences, not for tasks people do every session.
- Group related options. Labels name the **setting**, not the act of opening a page (`Notifications`, not `Tap to manage notifications`).
- Toggles apply immediately. Do not hide a Save on a binary preference.
- Frequent actions stay in the main UI. Do not exile them to Settings.
- Do not duplicate system Settings (appearance, notification permission, default apps). Link out to the system pane when the person must change a system switch.
- Offer a way back to defaults when the matrix is large.
- iOS: Settings bundle / system Settings pane for rare configuration; in-app only when options are needed while working.
- Mac: Preferences via the app menu; a document window is not a settings sheet by default.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `Form` / grouped `List` in a dedicated Settings scene; `Toggle` for instant prefs; `SettingsLink` / open system Settings when it is a system switch |
| UIKit | Grouped table settings; `UISlider` / `UISwitch` with persistent labels |
| AppKit / Mac | Settings window / `Settings` scene; menu bar **Settings**; not a phone-style stacked form in a document |
| Web | Dedicated `/settings` (or equivalent) grouped definition list / fieldset. Labels persist. One primary destructive (sign out / delete) separated |

## Do

- Put account, privacy, and notification **preferences** here; put notification **permission** timing in `patterns-notifications.md`.
- Use the same control language as `patterns-controls.md` (toggles for instant binary state).

## Don't

- Require Settings to complete first-run (that is onboarding).
- Nest every preference under undiscoverable chevrons with no grouping.
- Re-theme system Settings chrome.

## Checklist

- [ ] Settings files only (skip if none)
- [ ] Rare prefs, not daily tasks
- [ ] Instant toggles; no extra Save for binaries
- [ ] System switches deep-link out
- [ ] No exclusive lease on the same path as `forms` unless this screen *is* the form
