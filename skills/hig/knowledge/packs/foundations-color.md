# foundations-color

**Apple:** https://developer.apple.com/design/human-interface-guidelines/color  
**Also:** https://developer.apple.com/design/human-interface-guidelines/dark-mode  
**Phase:** 1

Dark Mode is composed here so color does not steal a second always-on lease from layout. Do not freeze appearance palettes or screenshot pixels.

## Apple guidance (durable)

- Color communicates hierarchy and state; it is not decoration first.
- System semantic roles (label, secondary label, fills, separators, links, success/warning/error) beat one-off hex sprawl.
- Contrast must hold for text and essential controls (aim WCAG AA for body and controls).
- Light and Dark are both first-class when the product supports them; honor the system appearance instead of shipping one inverted mock.
- Neutrals tint toward the brand hue instead of pure black/white in both appearances.
- Prefer a small set of semantic tokens over many unique colors.
- Photographs, product shots, and meaning-bearing artwork stay true; do not invert them when Dark Mode is on.
- Test Increase Contrast and Reduce Transparency with both appearances. Do not fake Dark Mode with a grey veil over light chrome.

## Web translation

- Map HIG roles → CSS variables in the project token file (`--text`, `--text-secondary`, `--fill`, `--separator`, `--accent`, `--danger`, …).
- Bind `--accent` (and friends) to **DESIGN.md brand**; packs do not prescribe a hue.
- Use semantic names in components (`var(--accent)`), never hard-coded campaign colors in chrome.
- Support `prefers-color-scheme` and/or an explicit theme switch if DESIGN.md says so; both appearances must use the same role names.
- Filled buttons need a dedicated on-accent / filled token that stays AA on the brand accent in light and dark.

## Do

- One accent role used sparingly for primary actions and selection.
- Separators and fills quieter than text in both appearances.
- Danger/success reserved for true status.
- Switch appearance with semantic tokens, not a second ad-hoc palette.

## Don't

- Rainbow accents across nav.
- Low-contrast muted text as the only label style.
- Glass tints replacing solid semantic fills on primary chrome.
- Hard-coded `#000` / `#fff` chrome that ignores Dark Mode.
- Color-only error or selected states (pair with text or icon).

## Interaction states

| State | Color behavior |
|---|---|
| Default | Semantic tokens in the active appearance |
| Hover / pressed | Slightly stronger fill or opacity step, same hue family |
| Selected | Accent or accent-tint background, not a new hue |
| Disabled | Reduced contrast, still readable when possible |
| Error | Danger token + text/icon, not color alone |

## Craft checklist

- [ ] Brand accent wired; no pack-invented hue
- [ ] Light/dark (if claimed) both use semantic roles
- [ ] Media that is not UI chrome is not inverted
- [ ] Separators ≠ heavy borders everywhere
- [ ] Contrast checked on primary filled controls in both appearances

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `Color` semantic roles / Asset Catalog Appearances; `colorScheme` from environment — not a custom hex table |
| UIKit | `UIColor` dynamic providers / named colors with Any + Dark; `overrideUserInterfaceStyle` only when the product offers an in-app appearance control |
| Web / CSS | Existing CSS variables; `prefers-color-scheme` (and optional class toggle). Same token names in both schemes |
| Mac / games | Follow system appearance on Mac chrome. Games HUD may keep a authored look; system overlays (Game Center, purchases) stay system-colored |

Map HIG semantic roles onto the host palette. Do not invent a new hue.
