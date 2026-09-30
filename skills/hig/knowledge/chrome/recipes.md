# Chrome recipes (any model)

Load with `grammar.yaml`. For each `structure:<id>` FAIL, apply the host snippet. Do not invent a kit. Do not paraphrase the FAIL away.

`scripts/apply-chrome.mjs` applies the grammar recipes it owns. Use this file when a host variant is outside those recipes.

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

## chrome.split.empty-select

Empty list: empty state in the detail. Do not leave "Select a…" copy when there is no row.

## chrome.split.list-width

Keep the list column readable when detail is empty (`minmax(18rem, 34%)` or a min width). Do not pin the list to a 48pt / 4rem rail.

## chrome.create.short-vs-long

Short create stays in the detail. Long create is a full page (`data-page="create"` / its own view), not a form trapped in the split.

## chrome.list-status.lifecycle

`loading` and `fault` do not show Add or an idle Select detail. `ready` may offer Add. Status is one of empty, loading, ready, fault.
