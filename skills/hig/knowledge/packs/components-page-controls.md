# components-page-controls

**Apple:** [Page controls](https://developer.apple.com/design/human-interface-guidelines/page-controls)  
**Also:** [Scroll views](https://developer.apple.com/design/human-interface-guidelines/scroll-views)  
**Surface id (later):** `page-controls`  
**Compose with:** required `navigation` chrome when the same carousel is leased; do not treat a tab bar or progress bar as a page control  
**Gate (later):** `always` when the host has a page-control / carousel-dots widget; skip otherwise

A page control is a row of indicator dots for an ordered, peer list of pages. It is not a tab bar, progress bar, or numbered pagination. Do not invent a page control. Do not map this pack onto `<progress>`, `role="tablist"`, or `1 2 3` page links.

## Apple guidance (1:1)

- Use a page control for movement through an ordered list of peer pages. It does not represent hierarchical or nonsequential relationships — use a sidebar or split view for those.
- Center it horizontally near the bottom of the view so people always know where to find it.
- Dots are equidistant. A solid dot is the current page. Extra dots clip or shrink at the edges.
- More than about 10 dots are hard to count at a glance. More than 10 peer pages belong in a different arrangement, such as a grid, that lets people navigate in any order.
- Custom indicator images stay simple. At most two different indicator images (for example Weather’s current-location symbol plus dots). Several unique images force people to memorize each mark and look messy.
- Let the system color the indicators. Custom colors reduce the contrast that marks the current page.
- People tap leading/trailing edges or scrub. Do not animate every scrub transition. Minimal background style does not support a scrubber.

## Don't

- A page control for hierarchical or nonsequential pages.
- More than about 10 page-control dots.
- More than two different page-control indicator images.
- Colored page-control indicator images.

## Apply in host

Map onto an existing page control (`UIPageControl`, paged `TabView`, `data-page-control`). Do not turn a tab bar into dots. Do not inject a kit. Do not invent a grid when there are too many pages.

| Host | Prefer |
|---|---|
| SwiftUI | `TabView` + `.tabViewStyle(.page)` with the system page indicator |
| UIKit | `UIPageControl` with a paging scroll view; system indicator colors |
| AppKit | Not a Mac page-control widget; do not invent dots on desktop chrome |
| Web | An existing carousel-dot row with `data-page-control`, not numbered pagination |

## Checklist

- [ ] A real page-control widget exists before this pack applies
- [ ] Pages are peers, not a hierarchy
- [ ] Dot count stays glanceable
- [ ] Indicator images are at most two kinds
- [ ] System colors the dots
- [ ] A tab bar, progress bar, or numbered page list is not treated as a page control
