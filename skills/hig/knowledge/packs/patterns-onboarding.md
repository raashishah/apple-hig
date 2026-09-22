# patterns-onboarding

**Apple:** [Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)

**Also:** Contextual tips live in `components-offering-help.md`. Do not treat this first-run pack as offering-help.

Own surface: first-run, empty-state coaching, permission primers. Distinct files from Settings and from Launching.

**Skip unless** the host has a first-run flow, feature tour, or empty-state coach marks. A tutorial presented again on a later launch is the violation. A first-launch tour stays allowed. Do not invent an onboarding flow. Do not remove the tour.

## Apple guidance (1:1)

- Onboarding gets people to a **quick start**, then gets out of the way.
- Skip is always available. Do not trap the first session in a carousel of marketing.
- Teach by doing in the real UI. Screens of text are a last resort.
- Request sign-in, tracking, notifications, and other permissions **at the moment of need**, not as a stack before first value. Notification copy lives in `patterns-notifications.md`.
- Do not replay the tour every launch. Show again only from Help / Settings.
- Empty states can onboard: one action that creates the first object beats a tutorial.
- Contextual tips belong to offering-help, not this first-run pack. Do not pack Watch workouts or ratings.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | Conditional first-run overlay with Skip; then the actual root `TabView` / split. Not a forever `fullScreenCover` |
| UIKit | Same: one skippable window, then the app’s root |
| Web | Skip control; persist “seen” in local storage / account. No infinite modal on every visit |
| Games | Skip cinematic / tutorial; do not steal the first match. Game Center chrome stays system |

## Do

- Align first-run with `patterns-launching.md`: launch into the app, then a thin onboarding if needed — not a branded mini-site then a second splash.

## Don't

- Require an account before any value if the app can run signed out.
- Ask for every permission on page one.
- Duplicate Help as six interstitial cards.
- A tutorial presented again on a later launch.

## Checklist

- [ ] Skip
- [ ] Permissions just-in-time
- [ ] Tour not on every launch
- [ ] Empty state has a first action
