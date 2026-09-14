# system-control-center

**Apple:** [Controls](https://developer.apple.com/design/human-interface-guidelines/controls) (Control Center, Lock Screen, Action button)  
**Surface id (later):** `control-center`  
**Pack file:** `system-control-center.md`  
**R11:** this is **not** swarm id `controls` and **not** `patterns-controls.md`. Required `controls` stays buttons, toggles, text fields, segmented controls.

**Gate:** `capability:controlcenter` (`ControlWidget` / Control Center control APIs). Ordinary buttons do **not** launch this pack. Web-css **skips**.

## Apple guidance (1:1)

- A Control Center **control** is a button or toggle that reaches an app feature from Control Center, the Lock Screen, or the Action button — without opening the app when possible (e.g. start a Live Activity).
- Anatomy: symbol, title, optional value. Control Center may show title/value at larger sizes; Lock Screen is **symbol only**; Action button shows symbol (and value) in the Dynamic Island.
- Symbol must read without the title. Toggles need **on and off** symbols. Animate state; animate in-progress actions until they finish.
- Update on interaction, completion, or push so the control matches real state.
- Tint: brand, applied to toggle-on and Action-button Dynamic Island.
- Configure on first add when the action needs a target (which light). Placeholder title/value in the gallery when they are situational.
- Action-button hint: **verbs** (`controlWidgetActionHint`).
- Locked device: redact title/value (and optionally force the off symbol) for personal or security data. Require unlock for security-changing actions (door, car).
- Locked-camera controls (iOS 18+): same camera UI as in-app; anything beyond capture needs unlock. Tell people how to add the control.

Not on watchOS, tvOS, or visionOS.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `ControlWidget` button vs toggle; configuration prompt; authentication policy; no custom Control Center chrome |
| Web / React | **Skip.** Do not style a settings row as “Control Center” |

## Checklist

- [ ] Id/filename are `control-center` / `system-control-center.md`, never `controls`
- [ ] Symbol works without title
- [ ] Locked-device redaction for sensitive values
- [ ] Required `controls` pack still means buttons/toggles/fields
