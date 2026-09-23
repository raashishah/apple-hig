# system-widgets

**Apple:** [Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)  
**Surface id (later):** `widgets`  
**Gate (later):** `capability:widgets` (WidgetKit target / `.widget` extension). Next.js / web-css **must not** select this id  
**Not in `hig-react`:** widgets are native system surfaces. Do not map them to React components or inject a widget kit.

## Apple guidance (1:1)

- Glanceable, timely content plus a few focused actions. Replicating the app icon adds little value.
- Prefer data that changes through the day. Updates are periodic, **not** real-time; the system may throttle. Let the system refresh dates/times. Animate updates at most ~2s.
- One idea per widget. Extra sizes only when they add a **layer** of information — do not stretch a small layout to fill large.
- Balance density. Brand colour/type sparingly; a tiny logo is enough if many sources appear. Do not mirror a fake widget inside the app.
- Tap empty area → deep link to the matching app screen. Buttons/toggles may act without launching. Inline accessory widgets: one target.
- Standard margins (~16pt; ~11pt only for tight groups). Concentric corners via `ContainerRelativeShape`. System font / SF Symbols; ≥11pt type.
- Meaning without colour alone (tinted / clear / vibrant / Watch inversion). Support light and dark. Accented mode: primary vs accent groups. Vibrant/Lock Screen: opaque light greys, not translucent white.
- Gallery: realistic preview, grouped sizes, **one** description starting with a verb. Placeholder: static chrome + grey shapes, not empty.

## Don't

- Mirror a fake Home Screen widget inside the app.
- Stretch a small widget layout to fill a large size.
- Replicate the app icon as a widget.

Live-link size tables, rendering-mode matrices, and Icon Composer / appearance catalogs — they churn yearly.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI + WidgetKit | `Widget`, `widgetURL`, `Link`/`Button`/`Toggle`; configurable intents when people must pick a subject |
| UIKit app with widget extension | Same WidgetKit UI; do not restyle Home Screen chrome in-app |
| Web / React / Next | **Skip.** No widget pack, no fake Home Screen tiles |

## Checklist

- [ ] Gate is capability-based; web fixtures skip
- [ ] Glanceable; deep link lands on the right screen
- [ ] No real-time polling cookbook; dates use system refresh
- [ ] `hig-react` unchanged — not a component library
