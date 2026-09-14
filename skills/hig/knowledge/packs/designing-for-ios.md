# designing-for-ios

**Apple:** https://developer.apple.com/design/human-interface-guidelines/designing-for-ios  
**Gate:** `ios` / phone (not Mac menu bar, not Game Center as exclusive)  
**Compose with:** design-principles, foundations-layout, patterns-navigation

iPhone Getting started. Feel of the platform — not a component catalog.

## Out of wave — iPhone Duo

[Designing for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) is **live** (inner/outer displays, poses, vertical bars). This wave **does not pack Duo**. Do not invent pose layouts, arrangement pixels, or fold numbers. Do **not** claim iOS Getting started is complete on a current iPhone host. Link the live page; wait for a later unit.

## Apple guidance

- Medium high-resolution display; hold in one or both hands; viewing distance about a foot or two.
- Inputs: Multi-Touch, virtual keyboard, voice; optional motion sensors and personal data **with permission**.
- Sessions mix glanceable minutes and longer media/games; people switch apps often.
- Limit onscreen controls; put secondary actions behind a short extra step.
- Adapt to orientation, Dark Mode, and Dynamic Type.
- Prefer reachability: primary actions mid/bottom; swipe-back and swipe-on-row where lists need it.
- System features to **live-link**, not reprint: [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets), [Home Screen quick actions](https://developer.apple.com/design/human-interface-guidelines/home-screen-quick-actions), Spotlight, Shortcuts, [Activity views](https://developer.apple.com/design/human-interface-guidelines/activity-views).

## Do

- Compact: one column; tab bar only for a few peer destinations on **product** register.
- Push navigation in a stack — not Mac-style document windows as the only model.
- Touch targets ≥44pt on primary controls.
- Gold QA: compact + regular **phone** widths (375 / 768) are valid **iPhone** evidence.

## Don't

- Force iPhone tab-bar-only canon onto Mac document windows or `register: brand` landings.
- Teach `UIDesignRequiresCompatibility` as a design.
- Cite `/navigation`, `/data-entry`, or `/app-intents` (404).

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `TabView`, `NavigationStack`, safe area, size classes |
| UIKit | Tab / nav controllers, layout margins, readable content guide |
| Web / CSS | Phone product: single column + fixed bottom peers; never invent iOS bars on marketing |
