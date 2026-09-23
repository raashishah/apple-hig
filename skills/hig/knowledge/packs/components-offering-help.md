# components-offering-help

**Apple:** [Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help)  
**Also:** [Inclusion](https://developer.apple.com/design/human-interface-guidelines/inclusion), [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)  
**Surface id (later):** `offering-help`  
**Compose with:** required `writing` when the same copy is leased; do not treat onboarding, inclusion, or a `title=` attribute as this widget  
**Gate (later):** `always` when the host has a tip, tooltip, or help overlay; skip otherwise

Offering help is contextual assistance: a tip, tooltip, or help overlay tied to the current task. Do not invent help. Do not map this pack onto first-run onboarding, inclusion copy, or every `title=` attribute.

## Apple guidance (1:1)

- Relate help to the action people are doing right now. Make it easy to dismiss. Do not explain how standard components work — describe the specific task.
- Keep language consistent with the platform. Do not tell people to click a button on iPhone or tap a menu item on a Mac.
- Tips stay short, actionable, and non-promotional. Promotional content advertises, sells, or belongs to a different flow.
- A tooltip describes only the control people indicate. Do not repeat the control’s name.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Help copy that tells people to click on iPhone or tap on Mac.
- Help content that explains how standard components work.
- Promotional content in a tip.
- The word popover in help documentation.

## Apply in host

Map onto an existing tip, tooltip, or help overlay (`TipView`, `popoverTip`, `.help(`, `role="tooltip"`, `data-help`). Do not turn onboarding into this pack. Do not inject a kit. Do not invent help copy.

| Host | Prefer |
|---|---|
| SwiftUI | An existing `TipView` / `.help` string, not a new coach-mark |
| UIKit | An existing tip popover, not a new alert |
| AppKit | An existing help tag, not a modal tutorial |
| Web | An existing `data-help` / `role="tooltip"` overlay, not every `title=` |

## Checklist

- [ ] A real tip, tooltip, or help overlay exists before this pack applies
- [ ] Platform verbs match the device
- [ ] Tips are not promotional
- [ ] Standard component tutorials stay out
- [ ] Onboarding and a `title=` attribute are not treated as this widget
