# components-text-views

**Apple:** [Text views](https://developer.apple.com/design/human-interface-guidelines/text-views)  
**Also:** [Labels](https://developer.apple.com/design/human-interface-guidelines/labels), [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields), [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)  
**Surface id (later):** `text-views`  
**Compose with:** required `forms` and `typography` when the same copy is leased; do not treat an `<input>`, a form `<label>`, or document body as a text view  
**Gate (later):** `always` when the host has a text-view widget; skip otherwise

A text view displays multiline, styled text, optionally editable. It is not a text field, a static label, or the page document. Do not invent a text view. Do not map this pack onto `<input>`, `<label>`, `aria-label`, or every `Text(`.

## Apple guidance (1:1)

- Use a text view when the text is long, editable, or in a special format. If you need a small amount of text, use a label — or a text field when people edit a small amount.
- Text views can be any height and scroll when content extends outside the view. Default alignment is leading. Default color is the system label color. Host typeface stays — this pack does not rewrite fonts.
- Make useful text selectable — error messages, serial numbers, IP addresses — so people can copy them.
- On iPhone and iPad, an editable text view shows a keyboard. Keyboard type belongs with Virtual keyboards; do not pack Watch/TV/Vision here.

## Don't

- A text view for a small amount of text.
- Useful text-view text people can't copy.

## Apply in host

Map onto an existing text view (`UITextView`, `NSTextView`, SwiftUI `TextEditor`, `<textarea>`, `data-text-view`). Do not turn an `<input>` into a textarea. Do not inject a kit. Do not invent a label.

| Host | Prefer |
|---|---|
| SwiftUI | `TextEditor` for long or styled copy; `TextField` / `Text` for a small amount |
| UIKit | `UITextView`; `UITextField` / `UILabel` for a small amount |
| AppKit | `NSTextView`; `NSTextField` for a small amount |
| Web | An existing `<textarea>` or `data-text-view` block, not `<input>` |

## Checklist

- [ ] A real text-view widget exists before this pack applies
- [ ] Small copy is a label or text field, not a text view
- [ ] Useful values can be copied
- [ ] An `<input>` and a form `<label>` are not treated as this widget
- [ ] Host fonts stay
