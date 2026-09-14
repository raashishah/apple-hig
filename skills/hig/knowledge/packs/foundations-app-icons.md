# foundations-app-icons

**Apple:** https://developer.apple.com/design/human-interface-guidelines/app-icons  
**Tools (live-link only):** [Icon Composer](https://developer.apple.com/icon-composer/), [WWDC26 Design guide](https://developer.apple.com/wwdc26/guides/design/), [Apple Design Resources](https://developer.apple.com/design/resources/)

Home-screen / product icon — not in-app SF Symbols (`foundations-icons.md`). Do not freeze layer grids, appearance variants (light / dark / clear / tinted), or Icon Composer pixels in this pack.

## Apple guidance (durable)

- The icon is unique and memorable; it expresses purpose at a glance.
- Design a simple mark that still reads at small sizes. Avoid tiny text inside the icon.
- Do not replicate a screenshot of the UI, an iOS device bezel, or another app’s mark.
- Platform mask and appearance variants are produced with **current** Apple tools — follow Icon Composer, do not hand-author a stale PNG set from this file.
- In-app branding still points here for the mark, and to `foundations-branding.md` for how often it appears.

## Do

- One recognizable silhouette; strong contrast against SpringBoard / Dock / Launchpad.
- Ship the icon through the host’s asset catalog or web favicon/app-manifest using the **source** from design, not a resized screenshot.
- Keep marketing and the installed icon the same idea.

## Don't

- Copying Icon Composer templates or variant recipes into the repo as “HIG law”.
- Photos of people or busy gradients that collapse to mud at 29pt.
- Alpha tricks that fight the system mask (follow the live icon page + Icon Composer).

## Apply in host

| Host | How |
|---|---|
| SwiftUI / UIKit | Asset Catalog / Icon Composer output; do not draw the app icon inside the app chrome except on About |
| Web / CSS | `favicon` + Apple touch icon from brand assets; not a new generated OG style unless product already owns one |
| Mac | App icon in the Dock/bundle; document icons only if the app is document-based |
| Games | Game icon follows the same glanceability rules; do not pack Game Center artwork here |

## Craft checklist

- [ ] Icon Composer / live HIG linked, not inlined
- [ ] No UI screenshot as the icon
- [ ] Favicon/app icon source is the product mark
