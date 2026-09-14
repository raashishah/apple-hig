# Apple HIG canon (1:1)

Source of truth: [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/).  
This file does **not** invent a house style. It restates Apple’s principles so `/hig` can apply them in whatever stack the host project already uses.

Brand (hue, typeface, voice) stays in the host `DESIGN.md`. Structure, density, materials, motion, and controls come from Apple.

## Aesthetic (Jony Ive)

Extreme simplicity, clarity, restraint. Remove until the remaining elements are inevitable. UI defers to content. No fashion layer, no decorative chrome, no parallel design system injected into the host.

If a change does not make the interface clearer or calmer, do not ship it.

## Apple principles

From [Designing for iOS](https://developer.apple.com/design/human-interface-guidelines/designing-for-ios) and platform companions (iPadOS, macOS, visionOS as relevant):

| Principle | Meaning for `/hig` |
|---|---|
| **Aesthetic integrity** | Appearance and behavior match the product’s purpose. A tool is dense and quiet; a brand landing is not an app shell. |
| **Consistency** | Use platform conventions the host already has (SwiftUI `List`/`NavigationSplitView`, UIKit bars, CSS that already tokens the app). Do not invent a second widget vocabulary. |
| **Direct manipulation** | Content follows the pointer/finger. Controls respond on press, not after a delay. |
| **Feedback** | Every action acknowledges itself (highlight, progress, result). Never silent failure. |
| **Metaphors** | Sheets, lists, switches, and split views behave like Apple’s, even on the web. |
| **User control** | Cancel is always available. Destructive actions are distinct. The system never hijacks the session. |

Also required from Apple’s foundations pages:

- **Hierarchy** before ornament ([Layout](https://developer.apple.com/design/human-interface-guidelines/layout)).
- **Semantic color**, not decoration ([Color](https://developer.apple.com/design/human-interface-guidelines/color)).
- **Type as structure** ([Typography](https://developer.apple.com/design/human-interface-guidelines/typography)).
- **Materials with purpose** ([Materials](https://developer.apple.com/design/human-interface-guidelines/materials)): standard system bars (Liquid Glass functional layer vs content layer); no custom opaque bar fills. Live-link [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass).
- **Motion that explains** ([Motion](https://developer.apple.com/design/human-interface-guidelines/motion)): interruptible, reduced-motion aware, never ornamental bounce.
- **Accessibility is not optional** ([Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)): Dynamic Type / zoom, contrast, labels, hit targets.

## Platform, not framework

Apple’s HIG is written for Apple platforms. `/hig` maps those rules onto the **host**:

| Host | Apply with |
|---|---|
| SwiftUI | System containers (`NavigationStack`, `NavigationSplitView`, `List`, `Form`, `.sheet`, `.alert`, `ToolbarItem`) |
| UIKit | `UINavigationController`, `UISplitViewController`, `UITabBarController`, `UITableView`/`UICollectionView`, system bars |
| Web / CSS | Existing tokens and components; CSS grid/flex chrome; no injected React kit |
| React (optional skill) | Same HIG; map to DOM/ARIA and the project’s components only |

Never copy another patient app’s brand (no Pink Depot rose, no personal-site fonts) into a new host.

## Shared laws (all stacks)

1. **Brand vs structure.** Colors, fonts, voice = host `DESIGN.md`. Packs = structure, density, materials, interaction.
2. **Apple docs, not patient apps.** Cite Apple HIG URLs. Chrome FAIL IDs live in `knowledge/chrome/grammar.yaml`.
3. **Materials.** Standard system bars, sheets, and controls. No custom opaque fills that fight glass. Respect Reduce Transparency / Increase Contrast. Do not teach `UIDesignRequiresCompatibility` as a design.
4. **List columns are browsers.** Compact toolbar, dense rows. Detail owns the large title and primary page chrome.
5. **Chrome grammar.** Solved FAILs have stable IDs. Review cites `structure:<id>`. Soft prose is not a substitute.
6. **Kit lock.** Use the host’s components and tokens. Do not add a parallel CSS/React system.
7. **Brand veto.** `register: brand` or `brand_mutation_veto: spacing_and_touch_targets_locked` → review/adapt do not change spacing or touch-target metrics. Structure FAILs still report.
8. **Marketing ≠ app chrome.** Never force tab bars or split views onto `register: brand` landings.

## Done test

The UI feels Apple-native when an outside reviewer can say: hierarchy is obvious, chrome is quiet, controls are familiar, motion is restrained, and nothing extra remains. Until then, `/hig` keeps swarming.
