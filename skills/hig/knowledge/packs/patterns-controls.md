# patterns-controls

**Apple:** [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Toggles](https://developer.apple.com/design/human-interface-guidelines/toggles), [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields), [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls)

## Apple guidance (1:1)

- One **primary** button per region. Destructive actions are visually distinct and separated.
- Buttons describe the action (`Save`, `Delete`), not `OK` when a verb is clearer.
- Toggles are for binary instant state, not for navigating or submitting.
- Text fields have a persistent label; placeholder is not the label.
- Segmented controls switch mutually exclusive views in the same context. Prefer **icons** for view-mode (list/grid) with an accessible name — text segments for modes that need words.
- Pressed state is visible. Disabled is visible and not the only error signal.

## Don't

- `OK` when a verb (`Save`, `Delete`) is clearer.
- Toggles that navigate or submit.
- Placeholder-as-only-label.
- Multiple primary actions in one region.
- The primary role on a button that performs a destructive action.
- A set of more than about five radio buttons.
- A segmented control that mixes text and images.
- A segmented control with eight or more segments.
- A segmented control that both selects and acts.
- A label that explains a button that changes the selection.
- A toggle that relies solely on different colors to communicate state.
- A label that introduces a square button.
- An image button with a system border.
- A custom button with a white background fill and black text.

## Apply in host

Use the platform control. Do not restyle a checkbox into a fake iOS switch unless the host already has that component.

| Host | Prefer |
|---|---|
| SwiftUI | `Button`, `Toggle`, `TextField`, `Picker` / `PickerStyle.segmented`, `toolbar` items |
| UIKit | `UIButton`, `UISwitch`, `UITextField`, `UISegmentedControl`, bar button items |
| Web | Existing buttons/inputs; role and keyboard parity; 44px phone targets |

## Chrome gates

- `chrome.view-mode.icons`
- `chrome.list-browser.filter-density`

Recipes: `knowledge/chrome/recipes.md`.

## Checklist

- [ ] Primary vs destructive vs cancel are distinct
- [ ] Labels persist on fields
- [ ] View-mode is icon segmented when it is a list/grid switch
- [ ] Filters are compact (toggle/chip), not a phrase checkbox
