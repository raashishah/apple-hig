# components-progress

**Apple:** [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators)  
**Also:** [Loading](https://developer.apple.com/design/human-interface-guidelines/loading), [Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback)  
**Surface id (later):** `progress`  
**Compose with:** loading/feedback pattern packs when those exist; do not lease the same spinner twice  
**Gate (later):** `always` when the host has async work

## Apple guidance (1:1)

- Indicators are **transient**: show only while work runs, then remove them.
- **Determinate** when duration is known (bar or circular track filling). **Indeterminate** (activity/spinner) when it is not. Prefer determinate. Switch indeterminate → determinate when duration becomes known. Never morph circular ↔ bar.
- Keep the indicator **moving**. A frozen spinner reads as a hung app; if work stalls, say so and what to do.
- Report advancement honestly. Do not jump to 90% then stall.
- Copy: accurate and short. Avoid empty words like “loading” or “authenticating”.
- Put the indicator in a **consistent** place.
- Offer Cancel when stopping is safe; Pause + Cancel when stopping would lose work. Confirm if cancel discards progress.
- Pull-to-refresh: specialised activity indicator. Still auto-update; do not make people pull for every refresh. Title only if it adds value (e.g. last updated) — never “pull down to refresh”.
- macOS: spinner for background or tight spaces; do not label a spinner people just started.

## Don't

- Morph a circular indicator into a bar mid-task.
- Jump progress to 90% then stall.
- Title pull-to-refresh "pull down to refresh".
- A label on a spinning progress indicator.
- A determinate progress indicator labeled Loading or Authenticating.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `ProgressView` determinate vs circular; consistent placement |
| UIKit | `UIProgressView`, `UIActivityIndicatorView`, `UIRefreshControl` |
| AppKit | `NSProgressIndicator` bar vs spinning |
| Web | `progress` / `aria-busy`; determinate `progressbar` when percent is known; do not freeze a CSS spinner |

## Checklist

- [ ] Determinate when percent is known
- [ ] No circular ↔ bar swap mid-task
- [ ] Indicator moves or stall copy appears
- [ ] Cancel/Pause when interrupting is possible
- [ ] Refresh is not the only update path
