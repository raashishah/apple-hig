# components-image-views

**Apple:** [Image views](https://developer.apple.com/design/human-interface-guidelines/image-views)  
**Also:** [Images](https://developer.apple.com/design/human-interface-guidelines/images), [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Icons](https://developer.apple.com/design/human-interface-guidelines/icons)  
**Surface id (later):** `image-views`  
**Compose with:** required `images` when the same asset is leased; do not treat every `<img>`, SF Symbol, or toolbar icon as an image view  
**Gate (later):** `always` when the host has a dedicated image-view widget; skip otherwise

An image view displays a single image — or an animated sequence — on a transparent or opaque background. It is typically not interactive. Do not invent an image view. Do not map this pack onto every `<img>`, `Image(systemName:)`, or decorative icon.

## Apple guidance (1:1)

- Use an image view when the primary purpose of the view is simply to display an image. If the image must be interactive, configure a system-provided button to display the image instead of adding button behaviors to the image view.
- If you want to display an icon, use a symbol or interface icon instead of an image view. SF Symbols and template glyphs belong with Icons — host fonts and symbol kits stay.
- Take care when overlaying text on images. Compositing text on top of images can decrease both the clarity of the image and the legibility of the text.
- Stretch, scale, or pin the image inside the view. Animated sequences stay a consistent size. Editable image wells are a Mac widget, not this pack.

## Don't

- Adding button behaviors to an image view.
- An image view for an interface icon.
- Overlaying text on an image view.

## Apply in host

Map onto an existing image view (`UIImageView`, `NSImageView`, `AsyncImage`, `data-image-view`). Do not turn every `<img>` into this pack. Do not inject a kit. Do not invent a button.

| Host | Prefer |
|---|---|
| SwiftUI | `AsyncImage` / a dedicated photo view; `Image(systemName:)` stays an icon |
| UIKit | `UIImageView`; a `UIButton` when the image is the control |
| AppKit | `NSImageView`; an image well when people edit the image |
| Web | An existing `data-image-view` photo, not every `<img>` |

## Checklist

- [ ] A real image-view widget exists before this pack applies
- [ ] Interactive images are buttons, not image views
- [ ] Icons and SF Symbols are not treated as this widget
- [ ] Text is not composited onto the image without a dedicated caption
- [ ] Every `<img>` is not treated as this widget
