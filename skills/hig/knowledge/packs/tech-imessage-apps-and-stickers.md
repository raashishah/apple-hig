# tech-imessage-apps-and-stickers

**Apple:** [iMessage apps and stickers](https://developer.apple.com/design/human-interface-guidelines/imessage-apps-and-stickers)  
**Surface id (later):** `imessage-apps-and-stickers`  
**Compose with:** packed image views when the same chrome already exists; do not treat an image view, a plain list, or a bare sticker word as this pack  
**Gate (later):** `always` when the host has sticker-pack chrome (`MSSticker`, `data-sticker-pack`); skip otherwise

A sticker pack uses one sticker size. Do not mix sizes in one pack. Do not invent a sticker pack. A file-size limit is not visible in source, so this pack does not scan it.

## Apple guidance (1:1)

- Pick the size that works best for the content and prepare every sticker at that size. Do not mix sizes within a single sticker pack.
- An image view stays on packed image views. A plain list stays on packed lists.
- The platform cluster keeps its live link. This pack does not complete Messages.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Mixed sizes within a single sticker pack.

## Apply in host

Map onto existing sticker-pack chrome (`MSSticker`, `data-sticker-pack`). Do not invent a sticker, a Messages extension, or a size. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing sticker-pack chrome when it already exists |
| UIKit | Existing sticker-pack chrome when it already exists |
| Messages | `MSSticker`, not a mixed-size pack |
| Web | Existing `data-sticker-pack`, not an `<img>` gallery |

## Checklist

- [ ] A real sticker pack exists before this pack applies
- [ ] Stickers in one pack share one size
- [ ] An image view and a plain list stay themselves
