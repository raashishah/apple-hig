# patterns-undo

**Apple:** [Undo and redo](https://developer.apple.com/design/human-interface-guidelines/undo-and-redo)

Own surface: undo managers, Edit > Undo, shake-to-undo, in-context Undo snackbars. Distinct from `forms` validation and from alert confirmation in `patterns-sheets.md`.

**Skip unless** the host edits content that can be reversed (text, canvas, list mutations, mail-style archive).

## Apple guidance (1:1)

- Undo (and redo when undo exists) lets people reverse actions and experiment safely.
- Name the action (`Undo Typing`, `Undo Delete`), not a generic `Undo` when the platform shows a label.
- Prefer undo over “Are you sure?” when the change is reversible. Use an alert only for **irreversible** loss (and keep that alert in sheets).
- Support multiple levels when the task is exploratory (drawing, layout, authoring).
- iPhone: system shake-to-undo is available; also provide an on-screen path in heavy editors (toolbar / Edit menu on iPad and Mac).
- Mac: Edit menu Undo/Redo with standard shortcuts. Do not rebind ⌘Z.
- A transient “Undo” affordance after archive/delete is valid feedback (`patterns-feedback.md`) **and** an undo action.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `UndoManager` / `TextField` system undo; explicit register for custom models |
| UIKit | `undoManager` on the responder; do not disable shake-to-undo without an equivalent |
| AppKit / Mac | First responder undo; Edit menu. Pointer document windows keep menu-bar undo even if a banner also appears |
| Web | `document.execCommand` is not the model — keep an undo stack for editor surfaces; expose Undo in the UI and Ctrl/⌘Z. Skip on read-only marketing pages |

## Do

- Register undo at the moment of commit, not on every keystroke coalesced poorly.
- Pair redo with undo.

## Don't

- Confirm every delete when Undo is one tap/shortcut away.
- Silent data loss on navigation with no undo and no draft.

## Checklist

- [ ] Reversible edits have undo
- [ ] Action is named
- [ ] Irreversible-only alerts
- [ ] Mac/iPad Edit menu or equivalent
