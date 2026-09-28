# tech-live-photos

**Apple:** [Live Photos](https://developer.apple.com/design/human-interface-guidelines/live-photos)  
**Surface id (later):** `live-photos`  
**Compose with:** packed playing-video when the same chrome already exists; do not treat every still photo, every `<video>`, packed playing-video, or a bare Live Photo phrase as this pack  
**Gate (later):** `always` when the host has Live Photo chrome (`PHLivePhotoView`, `PHLivePhoto`, `data-live-photo`); skip otherwise

Live Photos stay intact: frames and audio stay together, a video playback button is not the Live Photo control, and unsupported environments show a still instead of a replica. Do not invent PHLivePhotoView. Do not map this pack onto packed playing-video or every still photo.

## Apple guidance (1:1)

- Keep Live Photo content intact. Don’t disassemble a Live Photo and present its frames or audio separately.
- Never include a playback button that a viewer can interpret as a video playback button.
- Display Live Photos as traditional photos in environments that don’t support Live Photos. Don’t attempt to replicate the Live Photos experience provided in a supported environment. Instead, show a traditional, still representation of the photo.
- Prefer-system-player stays on packed playing-video. This pack does not invent a video player.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Live Photo frames or audio presented separately.
- Video playback button on a Live Photo.
- Live Photos experience replicated in an unsupported environment.

## Apply in host

Map onto existing Live Photo chrome (`PHLivePhotoView`, `PHLivePhoto`, `data-live-photo`). Do not invent PHLivePhotoView, a playback button, or a replica Live Photos experience. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `PHLivePhotoView` when it already exists, not a custom video replica |
| UIKit | `PHLivePhotoView` when it already exists |
| AppKit | Existing Live Photo chrome when it already exists |
| Web | Existing `data-live-photo`, not every still photo or packed playing-video |

## Checklist

- [ ] A real Live Photo widget exists before this pack applies
- [ ] Frames or audio are not presented separately
- [ ] A video playback button is not the Live Photo control
- [ ] Unsupported environments show a still, not a replica experience
- [ ] Every still photo, every `<video>`, and packed playing-video stay themselves
