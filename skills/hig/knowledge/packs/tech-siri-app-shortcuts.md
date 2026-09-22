# tech-siri-app-shortcuts

**Apple:** https://developer.apple.com/design/human-interface-guidelines/siri  
**Also:** https://developer.apple.com/design/human-interface-guidelines/app-shortcuts  
**Gate:** `capability:siri` / App Shortcuts (Info.plist Siri, App Shortcut providers — **not** `requiredIds`)  
**Compose:** `system-app-shortcuts.md` in this same worker. Do not launch a second exclusive `app-shortcuts` surface.  
Dedicated `siri` surface attaches by appleUrl. This cluster keeps app-shortcuts via `also:`.
Live pages are **Siri** and **App Shortcuts** only. There is no App Intents HIG article.

Siri and App Shortcuts invariants. Not a React mapping. Do not reprint phrase catalogs. App Intents hosts launch **one** worker.

## Human-only

Never complete Siri permission, voice enrollment, or Lock Screen auth. Style chrome **around** system Siri / Shortcuts UI.

## Apple guidance (invariants)

- People use Siri to find, know, or do everyday things. The product’s voice path must feel like Siri, not a custom assistant skin.
- An **App Shortcut** exposes a key function or content throughout the system (Spotlight, Shortcuts, Siri, Action button) without a manual shortcut recipe for that core job.
- Offer a few high-value shortcuts. Parameterize clearly (what, when, which account) instead of dozens of near-duplicate phrases.
- Results belong in system snippets / Siri UI. Do not hijack with a custom full-screen takeover that fights Siri.
- Do not require people to remember an exact invocation. Donated shortcuts and App Shortcuts should match what the UI already calls the action.
- Confirm destructive or paid actions. Do not silently spend or delete via voice.

## Do

- Name shortcuts with the same verbs as on-screen buttons.
- Keep Siri results glanceable; open the app only when the task needs the full UI.
- Native hosts only. `hig-react` stays mapping-only and does **not** gain Siri widgets.

## Don't

- Treat App Intents as a HIG article. Use the Siri and App Shortcuts pages.
- Re-skin Siri or Shortcuts editor chrome.
- Launch this pack on web-css / brand-veto.

## Apply in host

| Host | How |
|---|---|
| SwiftUI / App Intents framework | App Shortcuts provider + Siri result snippets; system UI unmodified |
| UIKit | Same intents; NSUserActivity donations where still used |
| Web / CSS | **Skip** |
