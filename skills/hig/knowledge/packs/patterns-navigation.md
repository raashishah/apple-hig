# patterns-navigation

**Apple:** https://developer.apple.com/design/human-interface-guidelines/tab-bars  
**Also:** [Sidebars](https://developer.apple.com/design/human-interface-guidelines/sidebars), [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars) (nav-bar successor; `UINavigationBar` is an API alias only)

**Compose with:** foundations-layout, foundations-materials

## Apple guidance (web-relevant)

- People always know where they are and how to go back.
- Navigation chrome is stable; content changes under it.
- Prefer few top-level destinations.
- Use standard tab bars, sidebars, and toolbars — not a custom opaque bar fill.

## Web translation

| Register | Pattern |
|---|---|
| product | System top nav or sidebar; phone may use fixed bottom tabs for 3–5 peers |
| brand | Simple header links or none; **never** force bottom tabs / split browsers |

- Active route: clear selected state (underline, weight, or fill) — not a loud badge farm.
- Back affordance on pushed detail when stack depth > 1.

## Do

- Prefer platform bars (`NavigationStack` toolbars, `UINavigationBar`, CSS that does not paint a solid bar fill).
- Put primary page title in the **detail/content**, not duplicated as a giant nav logo stack.
- Live-link [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass); do not freeze glass pixels.

## Don't

- Custom opaque fills or tints on nav / tool / tab bars that fight system materials.
- Teaching `UIDesignRequiresCompatibility` as a design.
- Turning a marketing landing into an iOS tab shell.
- A disabled or hidden tab bar button.
- A marketing word on a tab bar badge.
- A third level of hierarchy in a sidebar.
- A critical action at the bottom of a sidebar.
- A window titled with the app name.
- A toolbar item with no visible text and no accessible name.

## Interaction states

Nav items: default / hover / pressed / current / disabled.

## Chrome gates

Load `knowledge/chrome/grammar.yaml`. Product register only for sidebar:

- `chrome.sidebar.collapsible` — md+ sidebar has collapse/expand; not fixed expanded-only
- `chrome.bars.system-materials` — no custom opaque bar fill

Recipes: `knowledge/chrome/recipes.md`.

## Checklist

- [ ] Location clarity
- [ ] System chrome (no custom opaque bar fill)
- [ ] Register-appropriate pattern
- [ ] Hit targets ≥44px on phone primary nav
- [ ] Sidebar collapsible on product md+

## Apply in host

SwiftUI: `NavigationStack` / `NavigationSplitView` / `TabView` with system toolbars. UIKit: nav, split, tab controllers without custom bar backgrounds. Web: header or sidebar without an opaque painted bar; phone tabs only on product register.
