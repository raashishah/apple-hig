# designing-for-iphone-duo

**Apple:** https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo  
**Gate:** `duo,capability:duo` (`platform_primary: duo`, `capabilities: [duo]`, or Duo layout APIs — **not** `requiredIds`, **not** every `phone` host)  
**Compose with:** designing-for-ios, foundations-layout, patterns-lists-detail, patterns-navigation

iPhone Duo Getting started. Two displays, one continuous app. Not a stretched current iPhone. Not Watch / TV / Vision.

## Apple guidance

- Design **two size classes**, not a layout per pose: compact width on the **outer** display, regular width on the **inner** display. Avoid fixed widths, breakpoints, or metrics tied to one screen.
- People fold, stand, and set the device down. Hierarchy, destinations, and controls stay the same inside and out.
- System bars from navigation containers (`TabView` / `NavigationStack` and UIKit equivalents) move to the **side** on the outer display and on the inner display in landscape. Inner **portrait** keeps horizontal bars. Custom bar subclasses are skipped.
- Vertical bars prefer **symbol** items. Text-only items, segmented controls, Edit-style swaps, and keyboard accessory bars stay horizontal. Top of the vertical bar: Back/Close, then a prominent action such as Done.
- Content that follows **horizontal safe-area** insets offsets from the side bar. Immersive non-scrolling chrome may stay full-bleed only if interactive controls are not covered. Split View can put another app’s controls on the opposite edge.
- **Reserved regions:** outer camera (always; expands for Live Activities), inner camera while it is active, fold while partially open. Treat them like other layout insets.
- **Displacement:** alerts, menus, sheets, and tap targets move off the fold. Continuous scrolling (articles, feeds, lists, documents) does **not** displace.
- Book pose: contextual UI prefers the trailing side (continues on the outer display when closed). Table / portrait fold: media and glanceable content above; tappable controls on the stable lower half.
- Inner regular width: split view, reflow to two columns, or tab bar as sidebar — not a stretched compact column. Do not change the information hierarchy between displays.
- Arrangements (split vs overlay) follow an existing stack vs overlay relationship. Navigation containers wrap arrangements; do not nest an arrangement inside a list/scroll.

## Do

- Use system navigation, tab, and toolbar containers so vertical bars and overflow can run.
- Keep the same destinations on outer compact and inner regular width.
- Let system presentations avoid the fold; query reserved regions only for custom grids/controls that would otherwise sit on the hinge or camera.

## Don't

- Apply this pack on a current iPhone host (`platform: phone` with no Duo signal).
- Invent a unique layout per pose, fold pixel tables, or fake vertical bars on web marketing.
- Put primary tap targets in the fold. Do not displace scrolling lists to dodge it.
- Stretch a single compact column across the inner display.
- Teach `UIDesignRequiresCompatibility` as Duo design.

## Chrome gates

- `chrome.sidebar.collapsible` when inner regular width uses a sidebar / split (product register)
- `chrome.bars.system-materials` — system bars, not custom opaque fills

## Apply in host

| Host | How |
|---|---|
| SwiftUI | System `TabView` / `NavigationStack` bars; `NavigationSplitView` or `sidebarAdaptable` tabs on inner regular width; `ArrangementView` for split/overlay; `GeometryProxy.reservedRegions` for custom displacement |
| UIKit | System nav/tab/toolbar; `UISplitViewController`; `UIArrangementViewController`; `UIViewReservedRegion` / `reservedRegions(` |
| Web / CSS | **Skip** unless DESIGN.md opts into Duo. Then two size-class layouts only — never invent iOS vertical bars or fold geometry |

## Checklist

- [ ] Compact outer + regular inner, same hierarchy
- [ ] System bars; no custom bar classes that miss the vertical axis
- [ ] Scrolling content not forced off the fold
- [ ] Current-iPhone fixtures would not launch this id
