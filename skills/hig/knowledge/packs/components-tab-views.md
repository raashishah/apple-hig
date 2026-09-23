# components-tab-views

**Apple:** [Tab views](https://developer.apple.com/design/human-interface-guidelines/tab-views)  
**Surface id (later):** `tab-views`  
**Compose with:** required navigation when the same app also has a tab bar; do not treat a bottom tab bar, a segmented control, or page-control dots as this widget  
**Gate (later):** `always` when the host has an NSTabView-style tabbed pane; skip otherwise

A tab view presents mutually exclusive panes in one area, switched with tabs along the content. Not supported on iOS, iPadOS, tvOS, or visionOS. Do not invent a tab strip. Do not map this pack onto packed tab-bars, a segmented control, or page-control dots.

## Apple guidance (1:1)

- Use a tab view for closely related panes. People expect each tab to show similar content.
- Make sure controls in a pane affect content only in that pane.
- Avoid using a pop-up button to switch between tabs. A tabbed control takes one click and shows every choice.
- Avoid providing more than six tabs. More than six is overwhelming and creates layout issues.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A pop-up button used to switch between tabs.
- More than six tabs in a tab view.
- Controls in a pane that affect content in another pane.

## Apply in host

Map onto an existing tabbed pane (`NSTabView`, `data-tab-view`, `role="tablist"` plus `role="tabpanel"`). Do not turn a bottom tab bar or a segmented control into this pack. Do not inject a kit. Do not invent tabs or collapse extras into a menu.

| Host | Prefer |
|---|---|
| SwiftUI | An existing Mac tab view, not `TabView` as an iPhone tab bar |
| UIKit | A segmented pane only when it already is one; not `UITabBar` |
| AppKit | `NSTabView`, not a pop-up that swaps panes |
| Web | An existing `data-tab-view` / tablist+tabpanel, not a bottom tab bar |

## Checklist

- [ ] A real tabbed pane exists before this pack applies
- [ ] Tabs switch the pane, not a pop-up
- [ ] There are not more than six tabs
- [ ] Pane controls stay in their pane
- [ ] A bottom tab bar is not treated as this widget
