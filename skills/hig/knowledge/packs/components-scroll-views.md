# components-scroll-views

**Apple:** [Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views)  
**Surface id (later):** `scroll-views`  
**Compose with:** required `lists-split` / `layout` when the same pane is leased  
**Gate (later):** `always` when the host has a scroll container; skip otherwise

A scroll view lets people move content that is larger than the view. The document/body scrolling is not this widget. Do not invent a scroll view. Do not treat every page as a scroll view because the window scrolls.

## Apple guidance (1:1)

- Support default scrolling gestures. Custom scrolling still uses the elastic indicator behaviour people expect.
- Make it apparent when content is scrollable (partial content at an edge) because indicators are not always visible.
- Nested scroll views with the **same** orientation are unpredictable. A horizontal scroll inside a vertical scroll (or vice versa) is allowed.
- Page-by-page scrolling may use a page control. Do not show a same-axis scroll indicator next to that page control.
- Auto-scroll only as much as needed to keep a selection, insertion point, or pointer-driven selection in view.
- Scroll edge effects sit behind floating chrome, one per view, automatic style preferred.

## Don't

- Putting a scroll view inside another scroll view with the same orientation.

## Apply in host

Map onto an existing overflow pane, `ScrollView`, or platform scroll view. Do not add overflow to `html`/`body` to create this widget.

| Host | Prefer |
|---|---|
| SwiftUI | `ScrollView` axis that matches the content |
| UIKit | `UIScrollView` / `UITableView` scrolling as the host already uses |
| AppKit | `NSScrollView` |
| Web | A named pane with `overflow: auto` or `overflow: scroll`, not the document root |

## Checklist

- [ ] A real scroll container exists before this pack applies
- [ ] Same-axis nested scrolling is not introduced
- [ ] Cross-axis nesting may remain
- [ ] Document/body overflow is not this widget
