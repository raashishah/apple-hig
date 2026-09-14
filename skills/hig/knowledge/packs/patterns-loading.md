# patterns-loading

**Apple:** [Loading](https://developer.apple.com/design/human-interface-guidelines/loading)

Own surface: wait states, placeholders, refresh. Component chrome for bars/spinners is live-linked — U5 owns a deeper progress pack.

**Skip unless** the host has async loads, skeletons, spinners, or pull-to-refresh.

## Apple guidance (1:1)

- The best load finishes before people notice. Show useful cached content immediately, then replace.
- Prefer **placeholders that match the layout** (skeleton rows, image holes) over a centred spinner that blanks the app.
- If duration is knowable, show determinate progress. Never fake a bar that jumps to done.
- Do not block the whole interface. Let people cancel or keep using other chrome.
- Pull-to-refresh is extra, not the only way to get data.
- Launch / splash belongs in `patterns-launching.md`, not here.
- Live-link [Progress indicators](https://developer.apple.com/design/human-interface-guidelines/progress-indicators). Do not freeze indicator pixels or SF Symbol spinner names.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `redacted(reason: .placeholder)`, `ProgressView` in context, `.refreshable`; avoid full-screen blocking `ProgressView` |
| UIKit | `UIRefreshControl`, `UIProgressView` / `UIActivityIndicatorView` in the region that is loading |
| Web | Skeleton that matches CSS layout; `aria-busy` on the region; determinate `<progress>` when percent is real. No full-page freeze |

## Do

- Keep stale list rows visible while revalidating.
- Make long loads cancellable.

## Don't

- Loop an indeterminate spinner with no way out.
- Animate fake percent.
- Hide the nav behind a loading modal.

## Checklist

- [ ] Cached or placeholder content first
- [ ] Determinate when duration is known
- [ ] Non-blocking; cancel if long
- [ ] Launch screen not used as a loader
