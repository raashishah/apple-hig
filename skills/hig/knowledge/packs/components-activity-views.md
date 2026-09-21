# components-activity-views

**Apple:** [Activity views](https://developer.apple.com/design/human-interface-guidelines/activity-views)  
**Also:** [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)  
**Surface id (later):** `activity-views`  
**Compose with:** required `controls` when the same action is leased; do not treat the host page as an activity view  
**Gate (later):** `always` when the host has a share sheet / activity view; skip otherwise

An activity view — often called a share sheet — presents a range of tasks people can perform in the current context. Do not invent a share sheet. Do not map this pack onto the host page or every button labeled Share.

## Apple guidance (1:1)

- Avoid creating duplicate versions of common actions that are already available in the activity view. A second Print action is unnecessary and confusing. If app-specific print needs a custom title, use one that says what it does.
- Use the Share button to display an activity view. People expect system activities when they choose Share. Do not provide an alternative control that does the same thing.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Duplicate versions of common actions already in the activity view.
- An alternative control that presents the activity view instead of Share.

## Apply in host

Map onto an existing share sheet (`UIActivityViewController`, `ShareLink`, `data-activity-view`). Do not turn the host page into this pack. Do not inject a kit. Do not invent a Share button.

| Host | Prefer |
|---|---|
| SwiftUI | An existing `ShareLink` / share sheet, not a custom send modal |
| UIKit | An existing `UIActivityViewController`, not a second Print row |
| AppKit | Share extensions via the system Share button, not a replica sheet |
| Web | An existing `data-activity-view` / `data-share-sheet`, not the host page |

## Checklist

- [ ] A real share sheet exists before this pack applies
- [ ] Common actions are not duplicated
- [ ] Share (or the system Action button) reveals the sheet
- [ ] The host page is not treated as this widget
