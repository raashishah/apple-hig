# foundations-motion

**Apple:** https://developer.apple.com/design/human-interface-guidelines/motion

## Apple guidance (1:1)

- Motion explains, never decorates. It shows where something came from and where it went.
- Interface motion stays quick, subtle, and skippable. Prefer fade/position over bounce.
- Honor Reduce Motion: cross-fade instead of large slides/zooms when the user asks.
- Feedback is immediate on press. Gesture-driven surfaces track 1:1 and stay interruptible.
- Do not block input while a transition finishes.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `animation` / `withAnimation` tied to state; `.transaction` for reduce-motion; system sheet/navigation transitions first |
| UIKit | `UIViewPropertyAnimator`, interactive dismiss, `UIAccessibility.isReduceMotionEnabled` |
| Web / CSS | short easing on chrome; `prefers-reduced-motion: reduce` → opacity only; springs only for grab-able overlays |

## Do

- Respond on pointer/touch down.
- Keep overlay enter/exit under ~400ms unless the user is dragging.
- Match navigation pushes to platform defaults when they exist.

## Don't

- Ornamental bounce on menus that merely appeared.
- Locked-out UI during transitions.
- Parallax or large zooms when Reduce Motion is on.

## Checklist

- [ ] Reduce Motion path exists
- [ ] Press feedback is instant
- [ ] Overlays are interruptible or at least dismissible mid-motion
