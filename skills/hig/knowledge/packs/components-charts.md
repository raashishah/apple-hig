# components-charts

**Apple:** [Charts](https://developer.apple.com/design/human-interface-guidelines/charts)  
**Also:** [Charting data](https://developer.apple.com/design/human-interface-guidelines/charting-data)  
**Surface id (later):** `charts`  
**Compose with:** required `color` and `accessibility` when the same marks are leased; do not treat a table, list of numbers, or decorative SVG as a chart  
**Gate (later):** `always` when the host has a dedicated chart widget; skip otherwise

A chart plots data with marks, axes, and descriptions so people can compare values and see trends. It is not a table, a list, or every `<svg>`. Do not invent a chart. Do not map this pack onto `<table>`, `<ul>` of numbers, or toolbar icons.

## Apple guidance (1:1)

- Use a chart when you need to highlight information about a dataset. If you only need to provide the data, use a list or table people can scroll, search, and sort.
- Keep a chart simple. Too much data makes it visually overwhelming and obscures the relationships you want to show.
- Avoid relying solely on color to distinguish series or communicate essential information. Supplement color with shape, pattern, or labels.
- Do not require interaction to reveal critical information. Interaction can add detail; the main message stays visible.
- Host typeface stays. This pack does not rewrite fonts or inject a charting kit.

## Don't

- Relying solely on color to distinguish chart data.
- Hide critical chart information behind interaction.
- A chart of data that should be a table or list.
- A chart packed with too much data.

## Apply in host

Map onto an existing chart (`Chart { BarMark }`, `data-chart`). Do not turn a table into a chart. Do not inject a kit. Do not invent marks.

| Host | Prefer |
|---|---|
| SwiftUI | Swift Charts `Chart` + `BarMark` / `LineMark` / `PointMark` |
| UIKit | An existing plotted chart view, not a `UITableView` of numbers |
| AppKit | An existing plotted chart view, not an `NSTableView` of numbers |
| Web | An existing `data-chart` plot, not `<table>` or a decorative `<svg>` |

## Checklist

- [ ] A real chart widget exists before this pack applies
- [ ] Series are not color-only
- [ ] Critical values are visible without hover
- [ ] Raw inventories stay tables or lists
- [ ] A decorative SVG is not treated as this widget
