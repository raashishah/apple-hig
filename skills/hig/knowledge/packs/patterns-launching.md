# patterns-launching

**Apple:** [Launching](https://developer.apple.com/design/human-interface-guidelines/launching)

Own surface: launch screen, cold start, state restoration. Distinct from `patterns-loading.md` (in-app waits) and `patterns-onboarding.md` (first-run teaching).

**Skip unless** the host has a launch screen, splash, or startup gate (native apps almost always; web only if it paints a splash before first UI).

## Apple guidance (1:1)

- A streamlined launch gets people into the app immediately.
- The launch image / storyboard **matches the first real UI** (same chrome, empty of data) — not a logo poster that then jumps.
- Restore the last useful state when it still makes sense.
- Do not use the launch screen as a branding delay or a fake progress bar.
- Auth walls belong after launch if the person can already see something; do not serialize splash → login → onboarding → permission → home as four full-screen beats.
- Mac: a ready window, not an iPhone splash stretched. Games: keep branded intros skippable; do not reimplement Game Center / Sign in chrome.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI / UIKit | Asset catalog launch screen / storyboard that mirrors root chrome; `scenePhase` restoration. Skip inventing a SwiftUI splash `View` that duplicates the launch screen |
| AppKit / Mac | Window appears with content or a lightweight placeholder; no fake iOS launch storyboard as the product |
| Web | First paint is the app shell. Skip this pack if there is no splash. Never add a timed logo gate “for HIG” |

## Do

- Put placeholders in the first UI (`patterns-loading.md`) instead of extending launch.
- Keep first-run copy in onboarding, not on the launch image.

## Don't

- Animated splash after the system launch screen.
- Video / sound on launch.
- `UIDesignRequiresCompatibility` or custom opaque “brand bars” as a launch design.

## Checklist

- [ ] Launch chrome matches first UI
- [ ] Fast; no fake progress
- [ ] State restored when possible
- [ ] No extra splash View on web without an existing splash
