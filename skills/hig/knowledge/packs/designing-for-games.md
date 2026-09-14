# designing-for-games

**Apple:** https://developer.apple.com/design/human-interface-guidelines/designing-for-games  
**Gate:** `games` (GameKit / SpriteKit / game host — **not** web-css product chrome)  
**Compose with:** design-principles

Games Getting started. HUD and platform input. **Live-link** Game Center — do not reimplement its chrome.

## Apple guidance

- Jump into play: keep first install playable; extra content in the background; great defaults (resolution, paired controllers, accessibility).
- Teach in-world; written tutorials are optional references, not a gate.
- Ask permissions and ratings **in context**, after people have played.
- Legible type and usable buttons per platform (iPhone touch ≥44pt default; Mac pointer smaller). Prefer resolution-independent art. Respect safe areas (Home Indicator, Dynamic Island). Menus must reflow across aspect ratios — no fixed 16:9 HUD as the only layout.
- Full screen is expected; avoid letterboxing when the layout can change aspect.

### Input (must)

Live: [Game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls).

Prefer the **platform default**, then extras:

| Platform | Default | Additional |
|---|---|---|
| iOS | Touch | Game controller |
| iPadOS | Touch | Controller, keyboard, pointer, Pencil |
| macOS | Keyboard + mouse/trackpad | Game controller |

Controllers are optional. Virtual on-screen sticks must not be the only iPhone path if direct touch on world objects works. Do not require a DualShock-shaped HUD on Mac.

### HUD

- Frequent actions near thumbs; keep off Home Indicator / camera housing.
- Hide controls that are not available; show press/highlight feedback (finger covers the glyph).
- Action glyphs, not raw controller silhouettes, unless the player is on a physical pad.
- Pause or dim the world when system UI covers the game.

### Game Center (live-link)

**Do not pack artwork sizes, overlay pixels, or achievement catalogs.** Apply around the system UI only.

- [Game Center](https://developer.apple.com/design/human-interface-guidelines/game-center) + [GameKit](https://developer.apple.com/documentation/gamekit)
- Use the system access point / Game Overlay (or dashboard on tvOS/visionOS). Show the access point on **menus**, not during active play or splash/cinematics.
- Leave the chosen corner clear; collapsed and expanded states both fit.
- Pause while the overlay is up.
- Custom entry points: official Game Center artwork and terms (Game Center, Achievements, Leaderboards, Challenges — not trophies/rankings).
- Do not restyle or replace Sign in, purchase, or Game Center sheets.

Watch / TV / Vision game chrome stays out of wave.

## Do

- Detect GameKit / `.entitlements` Game Center / SpriteKit before applying this pack.
- Keep web marketing and CSS admin **off** this gate.

## Don't

- Re-skin Game Center or In-App Purchase chrome.
- Treat phone tab-bar FAIL IDs as game HUD requirements.
- Mention `/app-intents` as a live page (404).

## Apply in host

| Host | How |
|---|---|
| SpriteKit / GameplayKit | SK overlay vs world; safe-area layout; platform input |
| GameKit | Access point + overlay; deep links into system UI |
| SwiftUI / UIKit game wrapper | Full-screen game view; system overlay on top — do not fake it |
| Web / CSS | Skip unless the host is actually a game shell |
