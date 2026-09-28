# system-live-activities

**Apple:** [Live Activities](https://developer.apple.com/design/human-interface-guidelines/live-activities)  
**Surface id (later):** `live-activities` — separate from `widgets` (different host files: ActivityKit vs WidgetKit UI)  
**Gate (later):** `capability:live-activities`. Next.js / web-css **must not** select this id  
**Not in `hig-react`.**

## Apple guidance (1:1)

- Track a task with a **start and end**, typically hours not days (Apple: do not exceed eight hours). Not ads.
- Must support compact, minimal, expanded, and Lock Screen presentations (system composes Watch / CarPlay / menu bar / StandBy from these).
- Compact (Dynamic Island, one activity): leading + trailing read as **one** fact, snug to the camera, same deep link, do not pad away from the sensor, keep widths balanced.
- Minimal (several activities): still recognisable **and** updated (Timer shows remaining time, not only a logo).
- Expanded / Lock Screen: more detail; shrink height when there is less to say. Custom Lock Screen background only if contrast holds (Always-On). Compact/minimal/expanded backgrounds are not custom fills.
- Glanceable: medium-or-heavier type; no sensitive data on Lock Screen / Always-On — summarise or redact.
- Interactivity: at most one essential control (play/pause, contact driver). Tap opens the matching app screen.
- Start when the task starts; let people stop it in-app. Update only when content changes. Alert only for essential updates — do not double-notify with a push for the same fact.
- Prefer **one** Live Activity that rotates events over many simultaneous activities.
- End immediately when the task ends. Lock Screen / Mac menu bar / Watch may linger up to four hours; custom dismissal often 15–30 minutes for a short summary.
- Do not decorate the in-app UI to point at the Dynamic Island. Logo mark without a container; never the full app icon.

## Don't

- Decorate the in-app UI to point at the Dynamic Island.
- Put the full app icon on a Live Activity.
- Run ads in a Live Activity.

Live-link pixel specs and presentation templates.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI + ActivityKit | `ActivityRequest` / Live Activity UI for all presentations; `LiveActivityIntent` from App Shortcuts when starting from Action button |
| UIKit | ActivityKit UI still SwiftUI views |
| Web / React / Next | **Skip.** |

## Checklist

- [ ] Separate gate from widgets
- [ ] All four presentations exist
- [ ] No ads; no sensitive Lock Screen detail
- [ ] Ended when the task ends
