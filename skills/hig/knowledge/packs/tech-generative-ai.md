# tech-generative-ai

**Apple:** [Generative AI](https://developer.apple.com/design/human-interface-guidelines/generative-ai)  
**Surface id (later):** `generative-ai`  
**Compose with:** packed inclusion and packed privacy when the same chrome already exists; do not treat a textarea, "AI" marketing copy, or packed inclusion as this pack  
**Gate (later):** `always` when the host has a generative feature (`LanguageModelSession`, `ImagePlaygroundView`, `data-generative`); skip otherwise

Generative AI discloses that content is generated and keeps people in control of dismiss, revert, and retry. Do not invent a generative feature. Do not map this pack onto a textarea or packed inclusion.

## Apple guidance (1:1)

- Never trick someone into thinking they're interacting with or viewing content authored by a human if they're actually interacting with AI.
- Keep people in control. Give them the ability to dismiss new content they don't want, and revert or retry content transformations or other actions they don't agree with.
- Ask-permission and inclusive-result Don'ts stay on packed privacy and packed inclusion.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- AI content presented as human-authored.
- Generated content with no way to dismiss, revert, or retry.

## Apply in host

Map onto an existing generative feature (`LanguageModelSession`, `SystemLanguageModel`, `ImagePlaygroundView`, `FoundationModels`, `data-generative`). Do not invent a generative feature, AI-disclosure copy, Undo, or Retry. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `LanguageModelSession` / `ImagePlaygroundView`, not a custom AI overlay |
| UIKit | Existing Foundation Models chrome when it already exists |
| AppKit | Existing Foundation Models chrome when it already exists |
| Web | Existing `data-generative`, not a textarea |

## Checklist

- [ ] A real generative widget exists before this pack applies
- [ ] Generated content is not presented as human-authored
- [ ] People can dismiss, revert, or retry generated content
- [ ] A textarea and packed inclusion stay themselves
