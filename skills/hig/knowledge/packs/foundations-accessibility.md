# foundations-accessibility

**Apple:** https://developer.apple.com/design/human-interface-guidelines/accessibility

## Apple guidance (1:1)

- Every control has an accessible name. Icon-only controls still speak.
- Contrast holds for text and essential controls.
- Hit targets stay usable (Apple: 44×44 pt minimum for touch).
- Dynamic Type / user zoom: text reflows; primary labels do not clip.
- VoiceOver / screen reader order follows visual order.
- Do not convey meaning by color alone.
- Support Reduce Motion and, where relevant, Increase Contrast.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `.accessibilityLabel`, `.accessibilityHint`, `@Environment(\.dynamicTypeSize)`, traits |
| UIKit | `accessibilityLabel`, `UIAccessibility`, Dynamic Type text styles (`UIFont.preferredFont`) |
| Web / CSS | `aria-label` on icon controls, visible labels on fields, `:focus-visible`, rem-based type, 44px phone targets |

## Do

- Pair every icon segmented control with an accessible name (see `chrome.view-mode.icons`).
- Keep focus rings visible.

## Don't

- Placeholder-as-only-label.
- Tiny decorative type for critical data.
- Color-only error states.

## Checklist

- [ ] Names on icon-only controls
- [ ] Contrast on filled primary actions
- [ ] Touch targets on phone chrome
- [ ] Zoom / Dynamic Type does not clip titles
