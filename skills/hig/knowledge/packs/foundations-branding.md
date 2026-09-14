# foundations-branding

**Apple:** https://developer.apple.com/design/human-interface-guidelines/branding  
**Phase:** 1

Brand identity must stay recognizable **and** feel at home on the platform. Hue and typefaces still come from **DESIGN.md**. Kit lock: do not invent a parallel brand system.

## Apple guidance (durable)

- Express brand in content, color tokens, typography, and the app icon — not by restyling every system control.
- Give people a consistent experience: the same product should not feel like a different company on each screen.
- System bars, sheets, and lists stay standard. Custom skins that fight Liquid Glass / materials fail chrome.
- Splash branding is brief; do not trap people on a logo screen (see launching when packed).

## Do

- One accent, one wordmark usage, one icon family.
- Put the logo on the marketing/about surface, not on every list row.
- Let standard buttons look like platform buttons.

## Don't

- Painting opaque brand fills onto navigation/tool/tab bars.
- Watermarks on content.
- Rewriting SF Symbols into a custom outlined set “for brand”.

## Apply in host

| Host | How |
|---|---|
| SwiftUI / UIKit | AccentColor + DESIGN.md; standard `Button`/`UIButton` styles; app icon via `foundations-app-icons.md` |
| Web / CSS | Existing brand tokens only. No new `--hig-*` palette. Chrome stays system-like; marketing pages may be `register: brand` |
| Games | Title art and HUD can be strongly branded; Game Center / purchase / Sign in chrome stays system |

## Craft checklist

- [ ] DESIGN.md tokens, not pack hues
- [ ] Logo not duplicated in chrome
- [ ] System controls not re-skinned
