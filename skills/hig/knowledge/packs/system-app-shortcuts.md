# system-app-shortcuts

**Apple:** [App Shortcuts](https://developer.apple.com/design/human-interface-guidelines/app-shortcuts), [Siri](https://developer.apple.com/design/human-interface-guidelines/siri)  
**Surface id:** compose into `siri-app-shortcuts` — do not take a second exclusive lease  
**Gate:** `capability:siri` on the Siri worker. Web-css **skips**  
**Never cite** `/app-intents` (404). App Intents is the **framework**, not a HIG page.

Siri legal/UX invariants that need a human (biometrics, account sheets) stay out of apply. This pack is chrome and copy around system invocation.

## Apple guidance (1:1)

### App Shortcuts

- Key functions available at install (Siri, Spotlight, Shortcuts, Action button, Pencil squeeze). Up to **10** App Shortcuts per app.
- Prefer app **schemas** for common domains (mail, music, photos) so Siri AI can use built-in logic. App Shortcuts are for **unique** features schemas do not cover.
- Offer the most common tasks. One optional parameter with predictable values (`Start [morning, daily, sleep] meditation`). If the phrase needs two parameters, ask in a follow-up. Missing optional info: suggest a smart default.
- Voice phrases must be easy to say; include the app name (and natural variants). Discoverability: occasional in-app tip (`SiriTipUIView`).
- Respond with snippets (static/confirm) or Live Activities (ongoing). Audio-only devices: **full dialogue** must stand alone.
- Editorial: “App Shortcuts” and “Shortcuts” (the app) are title case and plural. A generic shortcut is lowercase. macOS: no App Shortcuts; App Intents actions still combine in Shortcuts.

### Siri

- Expose actions (intents) and content (entities) with App Intents. Annotate onscreen entities; donate relevant entities to Spotlight; donate actions so Siri can predict. Do not dump the whole catalogue unless the domain needs it (mail/messages).
- Familiar terms. No ads in Siri-delivered content. Prefer built-in Siri responses; customise only when they fail.
- Dialogue: clear, short, no forced humour; no app name (system attributes). Inclusive pronouns. Device-independent wording. Parental-controls-safe. Specific errors (“We’re out of chicken noodle soup”, not “Can’t complete your order”).
- Visual + spoken responses must each be complete. Open questions when the list is too long to read.
- Refer to Siri by name, never she/he. Do not impersonate Siri or use reserved phrases (`Hey Siri`, `Call 911`). Translate only “Hey” in localised “Hey Siri”.

## Apply in host

| Host | Prefer |
|---|---|
| Swift / App Intents | `AppShortcut`, phrases, schema domains where they fit; snippets / Live Activity responses |
| Web / React / Next | **Skip.** Do not fake a Siri sheet |

## Checklist

- [ ] No `/app-intents` URL
- [ ] ≤10 App Shortcuts; phrases memorable
- [ ] Audio dialogue complete without the screen
- [ ] Siri copy has no ads and no impersonation
