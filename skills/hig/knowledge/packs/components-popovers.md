# components-popovers

**Apple:** [Popovers](https://developer.apple.com/design/human-interface-guidelines/popovers)  
**Also:** [Modality](https://developer.apple.com/design/human-interface-guidelines/modality), [Alerts](https://developer.apple.com/design/human-interface-guidelines/alerts), [Sheets](https://developer.apple.com/design/human-interface-guidelines/sheets)  
**Surface id (later):** `popovers`  
**Compose with:** required `sheets` for compact-width sheet substitution; do not lease a sheet as a popover  
**Gate (later):** `always` when the host has a popover; skip otherwise

A popover is a transient view anchored to the control that revealed it. It is not a sheet, alert, or menu. Do not invent a popover. Do not map this pack onto `dialog` / `.sheet` overlays.

## Apple guidance (1:1)

- Use a popover for a small, related set of tasks. It disappears after the change so people can keep working.
- The arrow points at the revealing element. Do not cover that element or essential content.
- Close / Cancel / Done only when confirmation is needed. Otherwise dismiss on outside click or on selecting an item. Save work when a nonmodal popover auto-closes; discard only on explicit Cancel.
- Show **one** popover at a time. Never a cascade or hierarchy. Close the open one before showing another.
- Nothing displays on top of a popover except an alert.
- Keep the popover only as big as its contents.
- Warnings belong in an alert, not a popover — people can miss or accidentally close a popover.
- Compact/regular width: reserve popovers for wide views. Compact views present the same content in a sheet (or other full-screen modal).

## Don't

- A cascade or hierarchy of popovers.
- Using a popover to show a warning.
- Displaying popovers in compact views.

## Apply in host

Map onto an existing popover (`popover` attribute, `.popover`, `NSPopover`). Compact width uses a sheet the host already has — do not invent one. Do not apply these Don'ts to a sheet-only host.

| Host | Prefer |
|---|---|
| SwiftUI | `.popover` in regular width; compact width adapts to a sheet |
| UIKit | `UIPopoverPresentationController` in regular width |
| AppKit | `NSPopover` |
| Web | HTML `popover` / `popovertarget`, not a generic `dialog` sheet |

## Checklist

- [ ] A real popover exists before this pack applies
- [ ] No nested / cascade popovers
- [ ] Warnings are not popovers
- [ ] Compact width does not keep a popover
- [ ] A sheet host is not treated as a popover
