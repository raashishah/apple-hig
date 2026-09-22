# tech-cluster-game-center

**Apple:** [Game Center](https://developer.apple.com/design/human-interface-guidelines/game-center)  
**Surface id (later):** `game-center`  
**Compose with:** designing-for-games when that chrome already exists; do not treat a bare Game Center phrase, `import GameKit`, or packed designing-for-games as this pack  
**Gate (later):** `capability:gamecenter` when the host has Game Center chrome (`GKAccessPoint`, `data-game-center`); skip otherwise. Do not overlay `always`. Web hosts without that chrome stay skipped.

Prefer the system access point. Do not reimplement achievements, leaderboards, or Sign in. Do not complete Game Center authentication. Do not invent an access point.

## Apple guidance (1:1)

- Display the access point on menu screens. Do not show it during active gameplay, splash screens, cinematic flows, or tutorials.
- Use the artwork Game Center provides in custom links. Do not resize it or restyle it.
- Use the correct terminology in custom links. Do not write GameKit, GameCenter, or game center. Do not call achievements Awards. Do not call leaderboards Rankings.
- A bare Game Center phrase is not the access point. `import GameKit` is a capability signal, not the widget.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- The access point shown during active gameplay.
- Official Game Center artwork resized or restyled.
- Custom links that say GameKit, game center, Awards, or Rankings.

## Apply in host

Map onto existing Game Center chrome (`GKAccessPoint`, `data-game-center`). Do not invent an access point, a Game Overlay, or a sign-in sheet. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing `GKAccessPoint` when it already exists |
| UIKit | Existing `GKAccessPoint` when it already exists |
| AppKit | Existing `GKAccessPoint` when it already exists |
| Web | Existing `data-game-center`, not a bare Game Center phrase |

## Checklist

- [ ] A real Game Center access point exists before this pack applies
- [ ] The access point is not shown during active gameplay
- [ ] Official artwork is not resized or restyled
- [ ] Custom links do not say GameKit, game center, Awards, or Rankings
- [ ] A bare Game Center phrase and `import GameKit` stay themselves
