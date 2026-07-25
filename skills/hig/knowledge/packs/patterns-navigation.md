# patterns-navigation

**Apple:** https://developer.apple.com/design/human-interface-guidelines/navigation  
**Compose with:** foundations-layout, foundations-materials

## Apple guidance (web-relevant)

- People always know where they are and how to go back.
- Navigation chrome is stable; content changes under it.
- Prefer few top-level destinations.

## Web translation

| Register | Pattern |
|---|---|
| product | Opaque top nav or sidebar; phone may use fixed bottom tabs for 3–5 peers |
| brand | Simple header links or none; **never** force bottom tabs / split browsers |

- Active route: clear selected state (underline, weight, or fill) — not a loud badge farm.
- Back affordance on pushed detail when stack depth > 1.

## Do

- Keep nav opaque and high-contrast.
- Put primary page title in the **detail/content**, not duplicated as a giant nav logo stack.

## Don't

- Frosted glass nav bars.
- Turning a marketing landing into an iOS tab shell.

## Interaction states

Nav items: default / hover / pressed / current / disabled.

## Chrome gates

Load `knowledge/chrome/grammar.yaml`. Product register only:

- `chrome.sidebar.collapsible` — md+ sidebar has collapse/expand; not fixed expanded-only

## Checklist

- [ ] Location clarity
- [ ] Opaque chrome
- [ ] Register-appropriate pattern
- [ ] Hit targets ≥44px on phone primary nav
- [ ] Sidebar collapsible on product md+
