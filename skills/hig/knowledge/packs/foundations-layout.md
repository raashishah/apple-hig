# foundations-layout

**Apple:** https://developer.apple.com/design/human-interface-guidelines/layout  
**Phase:** 1

## Apple guidance (web-relevant)

- Alignment, spacing, and grouping create hierarchy before ornament.
- Respect safe areas / insets; content should not sit under fixed chrome.
- Consistent margins and a spacing rhythm beat arbitrary paddings.
- Adaptive layouts: columns and chrome change by size class (phone vs regular width).

## Web translation

- Use a spacing scale (4/8-based) as CSS variables.
- App shell: fixed/sticky opaque top or side chrome; main content scrolls independently.
- Split views: list pane has a stable width band; detail flexes. Avoid `min-width` on the list that crushes detail near 768px.
- Phone: single column; bottom tab bar fixed; content `padding-bottom` clears the bar.
- Prefer CSS grid/flex for page chrome; avoid nested card stacks for whole pages.

## Do

- Predictable content insets matching toolbar/nav.
- Group related controls with whitespace, not boxes-in-boxes.
- Test **768** and **375** as default web HIG widths.

## Don't

- Dashboard card grids as the default app home.
- List pane min-widths that steal detail space on tablet widths.
- `position: relative` bottom nav that scrolls away on phone.

## Interaction states

Layout itself is structural; focus order should follow visual order.

## Chrome gates

- `chrome.form.column-cohesion` (with patterns-forms)
- `chrome.sidebar.collapsible` (product shell, with patterns-navigation)

## Craft checklist

- [ ] Shell + safe padding correct per breakpoint
- [ ] Split list does not crush detail @768
- [ ] Phone bottom chrome fixed + content inset
- [ ] Spacing uses tokens, not magic numbers
- [ ] Form column + sidebar chrome gates PASS when applicable
