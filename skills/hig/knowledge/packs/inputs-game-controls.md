# inputs-game-controls

**Apple:** [Game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls)  
**Also:** [Designing for games](https://developer.apple.com/design/human-interface-guidelines/designing-for-games), [Game Center](https://developer.apple.com/design/human-interface-guidelines/game-center), [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures), [Keyboards](https://developer.apple.com/design/human-interface-guidelines/keyboards), [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices)  
**Intended gate (not wired this PR):** games / GameKit / SpriteKit hosts (U7). Web-css and ordinary product apps skip.

Prefer the platform’s default input. Do not reimplement Game Center, Sign in, or purchase chrome. Remotes and Eyes wait with TV/Vision.

## Apple guidance (1:1)

- Always offer the platform default: touch on iPhone/iPad, keyboard+pointer on Mac, plus optional physical controllers (every platform except Watch). Controllers are extra, not the only path unless the App Store “Game Controller Required” badge is honest — then detect and prompt, do not freeze.
- On-screen touch: 44×44 pt frequent controls, 28×28 pt secondary; keep off Home indicator and Dynamic Island. Left side movement (thumbstick appears under the thumb), right side camera via direct pan — not a second static stick. Hide unused virtual controls. Combine multi-button chords into tap / hold / double-tap on one control.
- Visible + haptic/audio press state; glyphs that mean the action (weapon), not Xbox/PlayStation letters as art.
- Physical controllers: use the connected device’s labels/SF Symbols, not a generic ABXY skin. Menu opens settings or pauses. Home/logo is system-reserved. Outside gameplay, A activates, B cancels/back, shoulders switch sections, sticks/D-pad move selection.
- Keyboards: single-key defaults (I inventory, Space primary), WASD neighbourhood for related actions, Command not Control on Apple keyboards, **user-customisable bindings**.
- Auto-detect pairing (`GCController`). Multiplayer: glyphs match the active pad.

## Apply in host

| Host | Prefer |
|---|---|
| SpriteKit / GameplayKit / Unity on Apple | Game Controller framework + Touch Controller virtual overlays; system pause/settings; Game Center UI as-is |
| SwiftUI / UIKit game wrapper | do not restyle `GK` dashboards; map Menu to pause; layout virtual controls in safe areas |
| Mac | keyboard+mouse first; controller optional; never block Command-Q |
| Web / CSS product | skip this pack |

## Do

- Platform default input plus optional controller.
- Safe-area virtual controls with press feedback.
- Customisable key bindings with sane defaults.

## Don't

- Controller-only on iPhone without a touch path (unless badged required).
- Fake Game Center overlays.
- Static on-screen sticks that cover content when idle.

## Checklist

- [ ] Games-shaped host would load this pack; web-css would not
- [ ] Default platform input exists
- [ ] Frequent touch controls ≥44 pt
- [ ] Menu/pause vs Home reserved
- [ ] No Digital Crown / remotes / Eyes pack in this unit
