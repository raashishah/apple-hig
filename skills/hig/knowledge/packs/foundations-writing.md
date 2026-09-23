# foundations-writing

**Apple:** https://developer.apple.com/design/human-interface-guidelines/writing  
**Phase:** 1

Interface words are part of the UI. Brand voice lives in **DESIGN.md**; this pack is HIG structure, not a style-guide reprint.

## Apple guidance (durable)

- Labels name the **action or object**, not the control type (“Save”, not “Tap the button”).
- Buttons and menu items use verb-first, scannable titles. Prefer sentence-style for longer strings; keep chrome short.
- Errors explain what happened and what to do next. Do not blame the person.
- Empty and loading states use the same vocabulary as the rest of the app.
- Match the platform’s standard terms for system jobs (Cancel, Delete, Share) unless DESIGN.md has an explicit product word.

## Do

- One primary verb per screen or alert.
- Field labels visible; placeholder is not the only name (see forms + accessibility).
- Parallel grammar in lists and segmented options.

## Don't

- Cute or sarcastic error copy that hides the fix.
- Visible copy that says we or we're.
- A robotic error that says Invalid name.
- A link that says Click here.
- Crucial information in a temporary empty state.
- Title Case On Every Long Sentence in body help.
- Rewriting system alerts (Sign in, Pay, permissions) — chrome around them only.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `Text` / `LocalizedStringKey`; buttons via `Button("Save")` style titles; alerts use role-appropriate actions |
| UIKit | `UIButton` titles, `UIAlertController` actions, `NSLocalizedString` |
| Web / CSS | Visible `<label>`, button text as the verb, `aria-describedby` for errors. Copy from DESIGN.md / product strings, not this pack |
| Mac | Menu bar titles: concise, ellipsis when the item opens a form that needs more input |

## Craft checklist

- [ ] Primary actions are verbs
- [ ] Errors include a next step
- [ ] Icon-only still has a spoken/visible name
- [ ] No pack-invented marketing taglines
