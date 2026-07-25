# foundations-color

**Apple:** https://developer.apple.com/design/human-interface-guidelines/color  
**Phase:** 1

## Apple guidance (web-relevant)

- Color communicates hierarchy and state; it is not decoration first.
- System semantic roles (label, secondary label, fills, separators, links, success/warning/error) beat one-off hex sprawl.
- Contrast must hold for text and essential controls (aim WCAG AA for body and controls).
- Dark and light are both first-class if the product supports them; neutrals tint toward the brand hue instead of pure black/white.
- Prefer a small set of semantic tokens over many unique colors.

## Web translation

- Map HIG roles → CSS variables in the project token file (`--text`, `--text-secondary`, `--fill`, `--separator`, `--accent`, `--danger`, …).
- Bind `--accent` (and friends) to **DESIGN.md brand**; packs do not prescribe a hue.
- Use semantic names in components (`var(--accent)`), never hard-coded campaign colors in chrome.
- Support `prefers-color-scheme` / explicit theme switch if DESIGN.md says so.
- Filled buttons need a dedicated on-accent / filled token that stays AA on the brand accent.

## Do

- One accent role used sparingly for primary actions and selection.
- Separators and fills quieter than text.
- Danger/success reserved for true status.

## Don't

- Rainbow accents across nav.
- Low-contrast muted text as the only label style.
- Glass tints replacing solid semantic fills on primary chrome.

## Interaction states

| State | Color behavior |
|---|---|
| Default | Semantic tokens |
| Hover / pressed | Slightly stronger fill or opacity step, same hue family |
| Selected | Accent or accent-tint background, not a new hue |
| Disabled | Reduced contrast, still readable when possible |
| Error | Danger token + text/icon, not color alone |

## Craft checklist

- [ ] Brand accent wired; no pack-invented hue
- [ ] Light/dark (if claimed) both use semantic roles
- [ ] Separators ≠ heavy borders everywhere
- [ ] Contrast checked on primary filled controls
