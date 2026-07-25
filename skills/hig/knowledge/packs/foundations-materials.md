# foundations-materials

**Apple:** https://developer.apple.com/design/human-interface-guidelines/materials  
**Phase:** 1

## Apple guidance (web-relevant)

- Materials help separate layers (chrome vs content vs transient surfaces).
- Vibrancy/blur are purposeful, not a default aesthetic.
- Content readability beats glass fashion.

## Web translation (workspace canon)

**Hybrid materials policy:**

| Layer | Material |
|---|---|
| Sidebar, top nav, bottom tab bar, page background, list rows | **Opaque** |
| Sheets, alerts, modal pickers (functional overlays) | **Glass optional** inside `@supports (backdrop-filter: …)` with solid fallback |

```css
/* Overlay only — never default nav */
.overlay-surface {
  background: var(--overlay-solid);
}
@supports (backdrop-filter: blur(20px)) {
  .overlay-surface {
    background: var(--overlay-glass);
    backdrop-filter: blur(20px) saturate(140%);
  }
}
```

## Do

- Keep primary navigation solid and legible.
- Use elevation sparingly (hairline separators > heavy shadows for Apple-like web).

## Don't

- Frosted glass on sidebars, bottom bars, or content cards by default.
- Stacking multiple translucent layers until text fails contrast.

## Interaction states

Overlays: enter/exit opacity + translate with reduced-motion fallbacks. Chrome materials stay stable while scrolling.

## Craft checklist

- [ ] Nav/content opaque
- [ ] Glass limited to functional overlays + `@supports` fallback
- [ ] No liquid-glass token leakage into primary chrome without an explicit product decision
