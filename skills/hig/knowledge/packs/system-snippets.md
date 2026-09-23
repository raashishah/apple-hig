# system-snippets

**Apple:** [Snippets](https://developer.apple.com/design/human-interface-guidelines/snippets)  
**Surface id (later):** `snippets`  
**Compose with:** packed App Shortcuts when the same chrome already exists; do not treat a card, a notification, or packed App Shortcuts as this pack  
**Gate (later):** `always` when the host has a Siri or App Shortcut snippet (`SnippetIntent`, `data-snippet`); skip otherwise

A snippet is a compact confirmation or result after a Siri or App Shortcut action. The custom view conveys purpose; spoken dialogue is not the visual source of truth, and the view stays within 400 points. Do not invent a snippet. Do not map this pack onto a card or packed App Shortcuts.

## Apple guidance (1:1)

- Communicate a snippet's purpose visually. Do not rely on showing the dialogue text to convey a snippet's purpose. Prefer to omit spoken dialogue from the snippet's visual representation and use the custom view instead.
- Keep content concise. Custom views are no taller than the 400-point maximum height. Deep-link into the app for more detail.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Spoken dialogue text used to convey a snippet's purpose.
- A snippet custom view taller than 400 points.

## Apply in host

Map onto an existing snippet (`SnippetIntent`, `data-snippet`). Do not invent a snippet, omit copy by rewriting brand voice, or cap height with a kit. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `SnippetIntent` views, not a custom overlay |
| UIKit | Existing snippet chrome when it already exists |
| AppKit | Existing snippet chrome when it already exists |
| Web | Existing `data-snippet`, not a card or a notification |

## Checklist

- [ ] A real snippet widget exists before this pack applies
- [ ] Spoken dialogue is not the visual source of purpose
- [ ] The custom view is not taller than 400 points
- [ ] A card, a notification, and packed App Shortcuts stay themselves
