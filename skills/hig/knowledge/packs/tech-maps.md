# tech-maps

**Apple:** [Maps](https://developer.apple.com/design/human-interface-guidelines/maps)  
**Surface id (later):** `maps`  
**Compose with:** packed carplay-maps when the same chrome already exists; do not treat CarPlay, a generic map word, or an iframe as this pack  
**Gate (later):** `always` when the host has MapKit chrome (`MKMapView`, `MapKit`, `mapkit.Map`, `data-map`); skip otherwise

Maps keep the Apple logo and legal link visible and do not copy Apple Maps styling onto an indoor map. Do not invent a map. Do not map this pack onto packed CarPlay.

## Apple guidance (1:1)

- Help people see the Apple logo and legal link. It's fine when parts of your interface temporarily cover the logo and link, but don't cover these elements all the time.
- Design an indoor map that feels like a natural extension of your app. Don't try to replicate the appearance of Apple Maps. Instead, make sure area overlays, icons, and text match the visual style of your app.
- MapKit JS on the web is the same article. This pack does not invent MapKit.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Maps legal link covered all the time.
- Indoor map that replicates Apple Maps.

## Apply in host

Map onto existing MapKit chrome (`MKMapView`, `MapKit`, `mapkit.Map`, `data-map`). Do not invent a map, attribution, or indoor tiles. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `Map` / `MKMapView` when it already exists, not a custom replica of Apple Maps |
| UIKit | `MKMapView` when it already exists |
| AppKit | `MKMapView` when it already exists |
| Web | Existing MapKit JS / `data-map`, not packed CarPlay or a generic map iframe |

## Checklist

- [ ] A real MapKit widget exists before this pack applies
- [ ] The Maps legal link is not covered all the time
- [ ] Indoor maps do not replicate Apple Maps
- [ ] Packed CarPlay stays itself
