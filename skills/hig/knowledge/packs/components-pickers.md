# components-pickers

**Apple:** [Pickers](https://developer.apple.com/design/human-interface-guidelines/pickers), [Steppers](https://developer.apple.com/design/human-interface-guidelines/steppers)  
**Also:** [Entering data](https://developer.apple.com/design/human-interface-guidelines/entering-data), [Pull-down buttons](https://developer.apple.com/design/human-interface-guidelines/pull-down-buttons)  
**Surface id (later):** `pickers`  
**Compose with:** required `controls` and `forms` when the same fields are leased  
**Gate (later):** `always` when the host has value selection; skip otherwise

Steppers sit in this pack (same selection/input concern). Do not invent a Digital Crown cookbook here (Watch is later).

## Apple guidance (1:1)

### Pickers

- Scrollable lists of distinct values. Use for **medium-to-long** lists. Short lists: a pull-down. Very large sets: a list/table (optionally indexed).
- Values must be predictable and logically ordered (hidden rows should be guessable, e.g. alphabetised countries).
- Show the picker in context — below or near the field, at the bottom of the window, or in a popover. Do not push a new screen solely to show a picker.
- Date/time: compact when space is tight; inline calendar/wheels when editing in place; wheels when keyboard/wheel entry helps. Minute intervals may coarsen if they divide 60 (e.g. 15). Countdown mode is not compact/inline.

### Steppers

- Two-segment increment/decrement. The stepper **does not show the value** — pair it with an obvious field.
- Small changes: stepper alone. Wide ranges: stepper **and** a text field (e.g. print copies).
- macOS: consider Shift-click for a larger increment. Not on watchOS or tvOS.

## Apply in host

Use platform pickers. Do not ship a custom wheel on the web unless the host already has that control.

| Host | Prefer |
|---|---|
| SwiftUI | `Picker`, `DatePicker`, `Stepper`; compact/inline/wheel styles as the field needs |
| UIKit | `UIPickerView`, `UIDatePicker`, `UIStepper` |
| AppKit | `NSDatePicker` textual vs graphical; stepper beside the value |
| Web | Native `<select>`, `<input type="date|time|number">`; 44px phone targets; do not fake iOS wheels |

## Checklist

- [ ] Short lists are not overweight wheels
- [ ] Picker stays in context
- [ ] Ordered, predictable values
- [ ] Stepper value is visible in a neighbouring field
- [ ] Wide ranges offer typed entry
