# designing-for-ipados

**Apple:** https://developer.apple.com/design/human-interface-guidelines/designing-for-ipados  
**Gate:** `ipad`  
**Compose with:** design-principles, designing-for-ios, foundations-layout, patterns-lists-detail

iPad Getting started. Power, mobility, flexibility — not a stretched iPhone.

## Apple guidance

- Large high-resolution display; hold, desk, or stand; viewing distance typically within about 3 feet.
- Inputs combine Multi-Touch, virtual or hardware keyboard, pointing, [Apple Pencil](https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble), and voice.
- People multitask: more than one app onscreen, [drag and drop](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop).
- Use the large canvas to reduce modality and full-screen pushes. Place controls where they are reachable, not in the way.
- Density follows viewing distance and input mode.
- Adapt to orientation, Stage Manager / windowed sizes, Dark Mode, Dynamic Type; Mac Catalyst should still feel Mac when that host is in play.
- System features to **live-link**: [Multitasking](https://developer.apple.com/design/human-interface-guidelines/multitasking), [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets), [The menu bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar) (iPad menu bar exists; Mac musts stay in `designing-for-macos.md`).

## Do

- Prefer split views and inspectors over nested iPhone push stacks for primary work.
- Keep pointer and Pencil as **additive** — they do not replace touch.
- Defer compact chrome until the regular layout no longer fits.

## Don't

- Ship phone-only bottom tabs as the iPad shell when a sidebar / split is the regular-width pattern.
- Treat 375-only screenshots as sufficient iPad evidence.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `NavigationSplitView`, `sidebarAdaptable` tabs, window scene sizing |
| UIKit | `UISplitViewController`, pointer/Pencil interactions, multitasking scenes |
| Web / CSS | Regular-width split: list band + flexing detail; no iPhone tab shell on tablet product |
