# foundations-images

**Apple:** https://developer.apple.com/design/human-interface-guidelines/images  
**Phase:** 1

How images behave in UI. Asset **scale tables** stay a live link on that page — do not copy @1x/@2x/@3x pixel grids here. Photographs in Dark Mode: see `foundations-color.md` (do not invert).

## Apple guidance (durable)

- Deliver art at the scale the display needs so UI images stay sharp without blowing file size.
- Prefer vector (PDF/SVG/SF Symbols) for chrome and simple objects; raster for photos.
- Preserve aspect ratio. Do not stretch faces or product shots to fill a cell.
- Provide a text alternative for images that convey information. Decorative images stay silent.
- Placeholders and empty frames should not look like broken downloads.

## Do

- Crop with a clear focal point; faces stay unclipped where the image is about a person.
- Lazy-load large photos; chrome icons stay local and crisp.
- Match corner radius to the container, not a random clip.

## Don't

- Screenshot dumps as empty-state “illustration”.
- Lossy scaling of SF Symbols exported as bitmaps.
- Copying Apple’s scale-factor tables into the host.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `Image` + `resizable`/`scaledToFill` with clip; Asset Catalog scales; SF Symbols instead of PNG chrome |
| UIKit | `UIImageView.contentMode`; asset catalogs; PDF vectors where appropriate |
| Web / CSS | `srcset`/`<picture>` or SVG; `object-fit: cover` with a known aspect; `alt` empty only when decorative |
| Mac / games | High-DPI backing stores; games art stays in the game pipeline, not HIG scale tables |

## Craft checklist

- [ ] Informative images have alt/accessibility labels
- [ ] No stretched photos
- [ ] Chrome is vector/symbol, not a photographed iPhone glyph
