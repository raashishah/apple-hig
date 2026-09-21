# foundations-materials

**Apple:** https://developer.apple.com/design/human-interface-guidelines/materials  
**Also:** [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass) (live; do not freeze pixels)  
**Phase:** 1

## Apple guidance (web-relevant)

- Materials help separate layers (chrome vs content vs transient surfaces).
- Liquid Glass is the **functional layer** (standard bars, sheets, popovers, controls). Content is the **content layer**.
- Vibrancy/blur are purposeful, not a default aesthetic.
- Content readability beats glass fashion. Test Reduce Transparency and Increase Contrast.

## Web translation (workspace canon)

**Hybrid materials policy:**

| Layer | Material |
|---|---|
| Sidebar, top nav, bottom tab bar (functional chrome) | **System / glass-safe** — no custom opaque bar fill or tint |
| Page background, list rows (content) | **Solid / content materials** (ultra-thin through thick as needed) |
| Sheets, alerts, modal pickers (functional overlays) | **System overlay** inside `@supports (backdrop-filter: …)` with solid fallback |

```css
/* Overlay only — never a painted opaque nav fill */
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

Do not ship a fake glass recipe for bars. Prefer the host system component.

## Do

- Use standard system bars, sheets, and controls.
- Use elevation sparingly (hairline separators > heavy shadows for Apple-like web).
- Keep chrome legible when Reduce Transparency / Increase Contrast is on.

## Don't

- Custom opaque fills on navigation, tool, or tab bars, or on split-view chrome.
- Teaching `UIDesignRequiresCompatibility` as a supported look.
- Stacking multiple translucent layers until text fails contrast.

## Interaction states

Overlays: enter/exit opacity + translate with reduced-motion fallbacks. Chrome materials stay stable while scrolling.

## Chrome gates

- `chrome.bars.system-materials`
- `chrome.materials.fashion-glass`

Recipes: `knowledge/chrome/recipes.md`.

## Recipe (any model)

No painted opaque nav fill. No `backdrop-filter` on `header` / `nav` / content cards. Overlay glass only, with solid `@supports` fallback.

## Craft checklist

- [ ] No custom opaque bar fill
- [ ] Glass limited to the functional layer + `@supports` fallback on web overlays
- [ ] Reduce Transparency / Increase Contrast considered
- [ ] No liquid-glass token leakage into content without an explicit product decision

## Apply in host

| Host | How |
|---|---|
| SwiftUI | System `Toolbar` / `NavigationStack` / `.sheet` materials; do not paint bar backgrounds |
| UIKit | System bars (`UINavigationBar`, `UIToolbar`, `UITabBar`) without custom `backgroundColor` / bar tint that fights glass |
| Web / CSS | Do not fill nav with an opaque solid that impersonates a pre-iOS 26 bar; overlay glass only inside `@supports` with solid fallback |
