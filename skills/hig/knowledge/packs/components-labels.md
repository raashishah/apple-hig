# components-labels

**Apple:** [Labels](https://developer.apple.com/design/human-interface-guidelines/labels)  
**Also:** [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields), [Text views](https://developer.apple.com/design/human-interface-guidelines/text-views)  
**Surface id (later):** `labels`  
**Compose with:** required `typography` and `forms` when the same copy is leased; do not treat a form `<label>` or every string as this widget  
**Gate (later):** `always` when the host has a static label widget; skip otherwise

A label is a static piece of text people can read and often copy, but not edit. It is not a text field, a text view, or an HTML form caption. Do not invent a label. Do not map this pack onto `<label>` wrapping an input, `aria-label`, or every `Text(`.

## Apple guidance (1:1)

- Use a label for a small amount of text people do not need to edit. If they need to edit a small amount, use a text field. If you need a large amount of text (optionally editable), use a text view.
- Labels appear in buttons, list rows, and views to explain context and what people can do next. SwiftUI uses `Label` and `Text` for uneditable text; AppKit uses a non-editable `NSTextField`.
- Prefer system fonts and Dynamic Type. Host typeface stays — this pack does not rewrite fonts.
- Use the four system label colors (primary, secondary, tertiary, quaternary) to show relative importance.
- Make useful label text selectable — error messages, locations, IP addresses — so people can copy them.

## Don't

- A label for text people need to edit.
- A label for a large amount of text.
- Useful label text people can't copy.

## Apply in host

Map onto an existing static label (`UILabel`, SwiftUI `Label`, `data-label`). Do not turn a form caption into this pack. Do not inject a kit. Do not invent a text field.

| Host | Prefer |
|---|---|
| SwiftUI | `Label` / non-editable `Text` for captions; `TextField` / `TextEditor` when people type |
| UIKit | `UILabel`; `UITextField` / `UITextView` when people type |
| AppKit | `NSTextField` with `isEditable = false` |
| Web | An existing static caption with `data-label`, not `<label>` around an `<input>` |

## Checklist

- [ ] A real static label widget exists before this pack applies
- [ ] Editable copy is a field or text view, not a label
- [ ] Long copy is a text view, not a label
- [ ] Useful values can be copied
- [ ] A form `<label>` and `aria-label` are not treated as this widget
