# patterns-forms

**Apple:** https://developer.apple.com/design/human-interface-guidelines/text-fields  
**Also:** buttons, feedback

## Apple guidance (web-relevant)

- Labels are clear; errors appear next to the field.
- Primary action is obvious; destructive actions are separated.

## Web translation

- Label above field (or leading label in settings-style rows).
- Min touch height ~44px on phone for primary inputs/buttons.
- Disabled state visibly distinct; do not rely on color alone for errors.
- Group related fields; one primary submit per form region.

## Do

- Native-feeling focus rings using brand accent or system focus.
- Inline validation after submit or blur, not only a toast.

## Don't

- Placeholder-as-only-label.
- Multiple equal-weight submits fighting each other.

## Interaction states

Field: default / focus / error / disabled. Button: default / hover / pressed / disabled / loading.

## Chrome gates

Load `knowledge/chrome/grammar.yaml`. Cite in review; implement to PASS:

- `chrome.form.column-cohesion` — title, actions, and fields share one column width

Recipes: `knowledge/chrome/recipes.md`.

## Recipe (any model)

One shared column for title, Save/Cancel, and fields. Persistent labels. One primary button. Phone controls ~44px.

## Checklist

- [ ] Labels present
- [ ] Error placement
- [ ] Touch-sized controls on phone
- [ ] One clear primary action
- [ ] Form column cohesion PASS

## Apply in host

SwiftUI `Form` / `LabeledContent`. UIKit grouped table forms. Web: persistent labels, ~44px phone controls, one primary submit; `chrome.form.column-cohesion`.
