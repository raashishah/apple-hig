# foundations-icons

**Apple:** https://developer.apple.com/design/human-interface-guidelines/icons  
**Also:** https://developer.apple.com/design/human-interface-guidelines/sf-symbols  
**Catalogs (live-link only):** [SF Symbols](https://developer.apple.com/sf-symbols/), [WWDC26 Design guide](https://developer.apple.com/wwdc26/guides/design/) (SF Symbols 8)

Icons and SF Symbols share one pack so chrome workers do not lease `App`/`ContentView` twice. Do not freeze symbol-name tables, grid templates, or yearly catalog pixels.

## Apple guidance (durable)

- An icon expresses **one** concept people can read at a glance.
- Prefer SF Symbols (or the host equivalent) for chrome, lists, and toolbar actions; custom marks are for brand moments, not every row.
- Weight, scale, and optical alignment match adjacent text. Do not mix random stroke weights in one bar.
- Icon-only controls still have an accessible name.
- Do not use a symbol whose meaning conflicts with the platform (e.g. a custom “share” that is not the system share glyph).
- App icons (home-screen marketing mark) live in `foundations-app-icons.md`, not here.

## Do

- One metaphor per action; reuse the same glyph for the same verb across the app.
- Match symbol scale to the control (toolbar vs list vs caption).
- Keep fills/accents on a small set of selected or destructive actions — not every glyph.

## Don't

- Pixel tables of SF Symbol names in this pack or in host tokens.
- Custom outlined doodles next to system symbols in the same toolbar.
- Decorative icons that duplicate a visible text label without a job.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `Image(systemName:)` / `Label`; hierarchy rendering; always `.accessibilityLabel` on icon-only |
| UIKit | `UIImage(systemName:)`; `UIButton.Configuration`; `accessibilityLabel` |
| Web / CSS | Existing icon set or inline SVG at text size; `aria-label` on icon-only buttons. Do not inject a new icon kit |
| Mac / games | Menus and toolbars use the same action glyph as the button. Games: system SF Symbols for system chrome only; HUD art stays game-authored |

## Craft checklist

- [ ] Icon-only controls named
- [ ] No symbol-name catalog copied into the host
- [ ] Toolbar glyphs share one weight/scale
- [ ] Brand mark not repeated as a list-row icon
