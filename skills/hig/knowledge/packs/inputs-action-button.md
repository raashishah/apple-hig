# inputs-action-button

**Apple:** [Action button](https://developer.apple.com/design/human-interface-guidelines/action-button)  
**Surface id (later):** `action-button`  
**Compose with:** packed App Shortcuts and Home Screen quick actions when the same chrome already exists; do not treat those widgets, or a bare Action button phrase, as this pack  
**Gate (later):** `always` when the host has Action button chrome (`data-action-button`); skip otherwise

An Action button label is at most three words. Do not repeat the Settings guidance for the Action button. Do not invent an Action button.

## Apple guidance (1:1)

- Keep labels as short as possible, with a maximum of three words.
- Avoid creating content that repeats the guidance offered in Settings for the Action button.
- App Shortcuts and Home Screen quick actions stay on their packs.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- An Action button label longer than three words.
- Content that repeats the Settings guidance for the Action button.

## Apply in host

Map onto existing Action button chrome (`data-action-button`). Do not invent an Action button, a shorter label, or Settings guidance. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing Action button chrome when it already exists |
| UIKit | Existing Action button chrome when it already exists |
| App Intents | Existing Action button label when it already exists, not an App Shortcut title |
| Web | Existing `data-action-button`, not a Home Screen quick action |

## Checklist

- [ ] A real Action button exists before this pack applies
- [ ] The Action button label is at most three words
- [ ] The host does not repeat Settings guidance for the Action button
- [ ] App Shortcuts and Home Screen quick actions stay themselves
