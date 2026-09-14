# components-action-sheets

**Apple:** [Action sheets](https://developer.apple.com/design/human-interface-guidelines/action-sheets)  
**Also:** [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets), [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts), [Modality](https://developer.apple.com/design/human-interface-guidelines/modality)  
**Surface id (later):** compose into required `sheets` — do not add a second exclusive lease on the same overlay files  
**Gate (later):** `always` with sheets; skip when the host has no confirmation choices

Not supported as this chrome on visionOS. Watch/TV packs stay out of this wave.

## Apple guidance (1:1)

- An action sheet presents **choices related to an action people already initiated**. Alerts are for unexpected problems or state changes. Menus appear when people **choose to reveal** them.
- Use sparingly; they interrupt.
- Keep the title to one line. Add a message only when the title plus context is not enough.
- Include Cancel so people can reject a data-destroying path. Place Cancel at the bottom (watchOS: upper leading).
- Destructive actions use the destructive style and sit at the **top**.
- Avoid a scrolling action sheet. Prefer few buttons so people see every choice at once (watchOS: at most four including Cancel).

## Apply in host

Compose with `patterns-sheets.md`. Same overlay files: sheet/alert/action-sheet roles, not three workers.

| Host | Prefer |
|---|---|
| SwiftUI | `.confirmationDialog` (action sheet); `.alert` for unexpected decisive moments; `.sheet` for tasks |
| UIKit | `UIAlertController` `.actionSheet` vs `.alert`; popover-anchor on iPad |
| Web | Dialog + scrim for choices after an explicit action; destructive distinct; Cancel last; do not use a hover menu for this |

## Checklist

- [ ] Action sheet vs alert vs menu roles are not swapped
- [ ] Destructive prominent; Cancel present when data can be lost
- [ ] Title short; extra message only if needed
- [ ] No nested modal stack without a strong reason
