# foundations-spacing

**Apple:** https://developer.apple.com/design/human-interface-guidelines/layout  
**Compose with:** foundations-layout

## Apple guidance (1:1)

- Grouping and alignment create hierarchy before boxes or shadows.
- Consistent margins and a repeating spacing rhythm beat arbitrary padding.
- Content respects safe areas and does not sit under fixed bars.
- Related controls share a cluster; unrelated groups are separated by larger gaps, not extra borders.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `padding` from a small scale; `safeAreaInset`; `List`/`Form` default row metrics before custom padding |
| UIKit | layout margins, readable content guide, `additionalSafeAreaInsets` for custom bars |
| Web / CSS | existing spacing tokens (4/8 rhythm). Do not invent a second scale |

## Do

- One rhythm (tight inside a control, medium inside a group, loose between groups).
- Match content inset to toolbar/nav height so nothing hides under chrome.

## Don't

- Magic numbers that fight the host’s tokens.
- Tight clusters that fail Apple’s ~44pt minimum hit target on phone (unless brand veto locks metrics).
- Extra nested cards used as fake spacing.

## Chrome gates

- `chrome.form.column-cohesion` (with patterns-forms)
- `chrome.ive.nested-cards`

Recipes: `knowledge/chrome/recipes.md`.

## Checklist

- [ ] Rhythm from tokens / system spacing
- [ ] Safe area / bar clearance
- [ ] Groups separated by space, not boxes-in-boxes
