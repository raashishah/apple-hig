# patterns-feedback

**Apple:** [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)

Own surface: transient status, haptics, sounds, inline result copy. **Modality stays with** `patterns-sheets.md` (alerts, sheets). **Motion physics stays with** `foundations-motion.md`.

**Skip unless** the host shows success/error toasts, banners, haptics, or other post-action status (not counting a single form error string already owned by `forms`).

## Apple guidance (1:1)

- Feedback tells people what is happening, what they can do next, what an action did, and how to avoid mistakes.
- Prefer **inline, non-blocking** confirmation for routine success. Alerts are for decisive, blocking choices — see sheets.
- Haptics mark significant moments, not every tap. Honor system haptic availability and Reduce Motion / vibration settings.
- Sound is optional reinforcement. Honor the silent switch / system mute; never require sound to understand state.
- Errors sit next to the cause and name a recovery. Do not rely on colour alone.
- Status must linger long enough to read; do not flash a toast over a one-shot error that needs action.
- Live-link [Playing haptics](https://developer.apple.com/design/human-interface-guidelines/playing-haptics). Do not pack workout / rating chrome here.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `.sensoryFeedback`, inline `Label` / section footer, non-modal banners; `.alert` only when sheets pack would also fire |
| UIKit | `UINotificationFeedbackGenerator` for notable outcomes; banner or inline error; not `UIAlertController` for “Saved” |
| Web | Inline status text / `role="status"`; errors `role="alert"` next to the field; toasts only for low-stakes success. No haptic API required |

## Do

- Confirm destructive-adjacent success with Undo when the action can be reversed (`patterns-undo.md`).
- Keep loading *progress* in `patterns-loading.md`; this pack is the result, not the wait.

## Don't

- Modal “Success” alerts after a save.
- Error-only-as-toast that disappears.
- Celebratory confetti on ordinary CRUD.

## Checklist

- [ ] Routine success is non-modal
- [ ] Errors recoverable and colocated
- [ ] Haptics/sound are optional and system-respecting
- [ ] Alerts not used as toast substitutes
