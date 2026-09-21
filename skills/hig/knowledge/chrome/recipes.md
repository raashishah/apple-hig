# Chrome recipes (any model)

Load with `grammar.yaml`. For each `structure:<id>` FAIL, apply the host snippet. Do not invent a kit. Do not paraphrase the FAIL away.

`scripts/apply-chrome.mjs` applies the P0 recipes it owns. Use this file for every other ID (including P1).

## chrome.view-mode.icons

Replace visible `List` / `Grid` text with icon-only segments. Keep the accessible name.

**Web / React:** icon buttons in `role="radiogroup"`; visible text off; `aria-label="List view"` / `Grid view`; `aria-pressed`.

**SwiftUI:** `Picker` + `.pickerStyle(.segmented)` with `Image(systemName:)` / `Label` icon-only + `.accessibilityLabel`.

**UIKit:** `UISegmentedControl` with images, `accessibilityLabel` per segment.

## chrome.list-browser.toolbar-budget

One compact toolbar above rows. Search, view-mode, filters share that band. Rows fill the column.

**Web:** one `header` / `role="toolbar"` in the list pane. Delete extra option bands.

**SwiftUI:** `toolbar` on the list; do not stack a custom header *and* a toolbar *and* a filter bar.

**UIKit:** one `UINavigationBar` / search controller; no second `UIToolbar` for the same pane.

## chrome.list-browser.filter-density

Simple filters are icon toggles, menus, or chips. Full phrase lives in `aria-label` only.

## chrome.form.column-cohesion

Wrap title, primary actions, and fields in one shared width (same `max-width` / `Form` container). Do not full-bleed the header over a capped field column.

## chrome.sidebar.collapsible

Product md+ sidebar: collapse/expand control (`aria-expanded` or `NavigationSplitView` column visibility). Do not leave `position: fixed` + static width as the only state.

## chrome.bars.system-materials

Do not paint `background: #hex` / `barTintColor` on nav, tab, or tool bars. Use the system bar. Content stays solid.

## chrome.materials.fashion-glass

`backdrop-filter` / blur only on sheets, alerts, pickers. Never on `header` / `nav` / content cards. Overlay glass needs a solid `@supports` fallback.

## chrome.layout.card-grid-home

Product home is a workspace (list, split, or tabs), not a dashboard of marketing cards. Move cards off the root or replace with a list/browser.

## chrome.ive.nested-cards

Do not wrap `List` / `<ul>` / `Form` in extra card panels. Grouped system content + hairline separators. Remove the outer card.
