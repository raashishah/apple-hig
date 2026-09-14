# foundations-right-to-left

**Apple:** https://developer.apple.com/design/human-interface-guidelines/right-to-left  
**Phase:** 1

Layout direction follows script. Do not ship a second mirrored design file; use leading/trailing.

## Apple guidance (durable)

- Reverse the **interface** for RTL scripts (Arabic, Hebrew, and others): navigation, chevrons that mean “forward”, reading order, and start-edge alignment.
- Do **not** mirror meaning-bearing marks: media transport (play), checkmarks, plus/minus that mean increase, logos, and playback timelines that represent time.
- Text alignment follows the paragraph direction; mixed LTR tokens (codes, numbers) keep their inner direction.
- Icons that are just chevrons or “back” affordances **do** flip; brand wordmarks do not.

## Do

- Use leading/trailing and start/end in layout APIs, not left/right.
- Flip push/pop chevrons and toolbar overflow that indicate direction.
- Test one RTL locale even if shipping copy is incomplete (pseudolocale is enough to catch left-locked CSS).

## Don't

- `transform: scaleX(-1)` on the whole window (mirrors photos, video, and logos).
- Hard-coded `margin-left` / `padding-right` for chrome that should follow reading direction.
- Assuming a back chevron always points left.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `layoutDirection`; `leading`/`trailing` padding; `flipsForRightToLeftLayoutDirection` only on directional glyphs |
| UIKit | Auto Layout leading/trailing; `semanticContentAttribute`; `imageFlippedForRightToLeftLayoutDirection` |
| Web / CSS | `dir="rtl"` / `dir="auto"` on `html` or locale root; logical properties (`margin-inline-start`, `inset-inline-end`, `text-align: start`) |
| Mac | Window chrome follows AppKit leading; document canvases that represent physical pages may stay LTR |

## Craft checklist

- [ ] No physical left/right in new chrome CSS/Swift
- [ ] Media/play and logos not mirrored
- [ ] Forward chevrons follow reading direction
