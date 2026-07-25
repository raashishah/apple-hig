# Explorer: Pink Depot split/list/create chrome

**Repo:** `/Users/raash/Documents/Pink Depot/`  
**Angle:** How solved chrome is implemented in code vs soft AGENTS.md/DESIGN.md rules; what should become portable hard FAIL IDs.  
**Date:** 2026-07-25

---

### Components Found

| Piece | Path | Role |
|-------|------|------|
| `CatalogSplitLayout` | `src/components/layout/CatalogSplitLayout.tsx` | Thin config→`SplitView` adapter; used by inventory/vendors/orders/purchases layouts |
| `CATALOG_SPLITS` | `src/lib/catalog-split.ts` | Per-catalog: `basePath`, `placeholder`, `excludePaths`, `idleFullBrowse` |
| `SplitView` | `src/components/layout/SplitView.tsx` | md+ list/detail; phone one-column; idle-detail suppression; resizer |
| `split-list-width` | `src/lib/split-list-width.ts` | Shared list % preference (18–55, default 34); `localStorage` key `pink-depot:split-list-pct` |
| `SplitListState` / `ListPaneStatus` | `src/components/layout/SplitListState.tsx` | Status union `loading \| empty \| ready \| fault`; context + reporter |
| `SplitListPending` / `SplitListFault` | `src/components/layout/SplitListPending.tsx` | Suspense → `loading`; fetch/setup → `fault` |
| `SplitListSlot` | `src/components/layout/SplitListSlot.tsx` | Suspense boundary around `@list` parallel slot |
| `ListPaneChrome` | `src/components/layout/ListPaneChrome.tsx` | Title + **one** `.we__list-pane-band` (search + tools + Add); Add iff `ready` && !creating |
| `listCreating` / `listActiveId` | `src/lib/list-filter.ts` | Path helpers for short-create + row highlight |
| `FormPageChrome` | `src/components/layout/FormPageChrome.tsx` | `width="detail"` (default) vs `full`; header actions md+, phone action bar |
| `ViewModeToggle` | `src/components/ui/ViewModeToggle.tsx` | Icon-only segmented when every option has `icon` → `.we__segmented--icons` |
| List panels | `*ListPanel.tsx` (inventory/vendors/orders/purchases/products) | Wrap client in `ListPaneStatus` or `SplitListFault` |
| CSS | `we-overlays.css` (`.we__split*`), `we-layout.css` (`.we__page--detail`, `.we__list-pane-band`, form column), `tokens.css` (`--split-list-width: 20rem`, `--split-list-max-ratio: 34%`) |

**Deleted by recent unify (1fc3156):** per-route `InventorySplitLayout` / `VendorsSplitLayout` / `OrdersSplitLayout` / `PurchasesSplitLayout`; `variant="browse-primary"` — replaced by `idleFullBrowse` + shared `CatalogSplitLayout`.

**Already hard in portable grammar** (`hig-plugin/.../chrome/grammar.yaml`):  
`chrome.view-mode.icons`, `chrome.list-browser.toolbar-budget`, `chrome.list-browser.filter-density`, `chrome.form.column-cohesion`, `chrome.sidebar.collapsible`.

**Still soft** (AGENTS.md / DESIGN.md prose only; not in grammar.yaml): empty-catalog no placeholder; short vs long create placement; list width budget; `ListPaneStatus` lifecycle; Add-only-when-ready; single empty CTA; shared split (not per-route); inventory idle-full-browse.

---

### Flow

#### A. Shared split wiring (md+ ≥ `48rem` / `DETAIL_BREAKPOINT`)

1. Route layout (`inventory|vendors|orders|purchases/layout.tsx`) → `CatalogSplitLayout catalog=…` with parallel `@list` slot + `children` detail.
2. `CATALOG_SPLITS[catalog]` supplies placeholder copy, optional `excludePaths`, optional `idleFullBrowse`.
3. `SplitView` wraps with `SplitListStateProvider` (default status `"loading"`).
4. Wide viewport:
   - **Excluded path** (`/inventory/new`, `/orders/new`): render `children` only (full page; no list column).
   - **Detail path** (`basePath/…` ≠ index): list + resizer + detail (`DetailMotion`).
   - **Idle index:**
     - `hideIdleDetail = idleFullBrowse \|\| (status !== "ready")` → if true and not detail: **omit** detail pane; add `.we__split--idle-full` so list fills width.
     - Else (vendors/orders/purchases with `ready` + no selection): show placeholder text in detail (top-aligned muted copy — not a card).
5. Narrow viewport: index → list only; detail route → `children` only (list lives in `@list` so soft nav does not refetch).

#### B. ListPaneStatus lifecycle

| Status | Who sets it | Effect on idle detail | Effect on toolbar Add |
|--------|-------------|----------------------|------------------------|
| `loading` | `SplitListPending` / provider default / cleanup of reporter | Hidden (`suppressIdle`) | Hidden |
| `empty` | `ListPaneStatus` when `rows.length === 0` | Hidden | Hidden (empty-state owns CTA) |
| `fault` | `SplitListFault` | Hidden | Hidden |
| `ready` | `ListPaneStatus` when rows exist | Shown only if not `idleFullBrowse` | Shown (unless `listCreating`) |

Call sites wrapping panels:  
`InventoryListPanel`, `VendorsListPanel`, `OrdersListPanel`, `PurchasesListPanel`, `ProductsListPanel` (products has no `SplitView`; `ListPaneChrome` mounts its own provider so Add still gates).

#### C. Empty catalog — no dead “Select a…”

- Mechanism: `status !== "ready"` → `hideIdleDetail` → detail DOM not mounted; CSS `.we__split--idle-full` expands list.
- Inventory additionally always idle-full until a row is selected (`idleFullBrowse: true`), even when `ready`.
- Empty UI is full-width `EmptyState` in the list column with one create CTA (vendors/POs suppress that CTA while `listCreating` so short create in detail does not duplicate).

#### D. Short vs long creates

| Route | Split behavior | Form chrome |
|-------|----------------|-------------|
| `/vendors/new` | **In split detail** (not in `excludePaths`); `@list/new` re-exports list so list stays | `FormPageChrome` default `width="detail"`; CSS fills pane inside `.we__split-detail` |
| `/purchases/new` | **In split detail** (same) | `width="full"` but still inside split; `.we__split-detail .we__page--detail { max-width: none }` fills pane |
| `/inventory/new` | **Excluded** — full page | `width="detail"` → `.we__page--detail` centered (`max-width: 36rem`, `margin-inline: auto`) |
| `/orders/new` | **Excluded** — full page | Order editor / `FormPageChrome` full-page |
| `/products/new` | No split catalog | Full-page centered create (then editor) |

Short-create list slots: `vendors/@list/new/page.tsx`, `purchases/@list/new/page.tsx` — keep list mounted while create is in detail.

#### E. Inventory browse toolbar (matches existing grammar)

Still: one `.we__list-pane-band` = search + `ViewModeToggle` (List/Grid **icons**, labels via `aria-label`/`title` only) + hide-OOS **icon** button + Filters **icon** (+ badge) + ghost Add.  
Prefs: `pink-depot:inventory-view-mode` (default list), hide-OOS localStorage. Tools omitted when `items.length === 0`.  
→ Aligns with `chrome.view-mode.icons`, `chrome.list-browser.toolbar-budget`, `chrome.list-browser.filter-density`.

#### F. Form column cohesion (already grammar)

- Full-page long creates: `.we__page--detail` centers one column.
- Inside split: override so form is not re-centered/orphaned half-width.
- Header actions sit in `PageHeader` trailing — not a second full-bleed toolbar over capped fields.
- → `chrome.form.column-cohesion`.

---

### Files Read

- `src/components/layout/SplitView.tsx`
- `src/components/layout/CatalogSplitLayout.tsx`
- `src/lib/catalog-split.ts`
- `src/lib/split-list-width.ts`
- `src/components/layout/SplitListState.tsx`
- `src/components/layout/SplitListPending.tsx`
- `src/components/layout/SplitListSlot.tsx`
- `src/components/layout/ListPaneChrome.tsx`
- `src/components/layout/FormPageChrome.tsx`
- `src/lib/list-filter.ts`
- `src/components/ui/ViewModeToggle.tsx`
- `src/components/inventory/InventoryListClient.tsx` (tools band + empty)
- `src/components/inventory/InventoryListPanel.tsx`
- `src/components/vendors/VendorsListClient.tsx` / `VendorsListPanel.tsx`
- `src/components/purchases/CreatePurchaseOrderForm.tsx` (short create + `width="full"`)
- `src/app/(app)/{inventory,vendors,orders,purchases}/layout.tsx`
- `src/app/(app)/vendors/@list/new/page.tsx`, `purchases/@list/new/page.tsx`
- `src/app/(app)/inventory/new/page.tsx`, `vendors/new/page.tsx`, `purchases/new/page.tsx`, `orders/new/page.tsx`
- `src/app/styles/we-overlays.css` (split), `we-layout.css` (form/list chrome), `tokens.css` (split tokens)
- `AGENTS.md` (prefs L4, L12; facts L27–L28)
- `DESIGN.md` (foundations L23–27; component catalog SplitView/FormPageChrome; iPad split L237–239)
- `.cursor/rules/apple-hig-ui.mdc`
- `hig-plugin/skills/hig/knowledge/chrome/grammar.yaml` (current hard IDs)
- Commits: `5e7904b`, `4d31fc6`, `9c39fac`, `1fc3156` (+ `b81cdea` AGENTS refresh adjacent)

---

### Boundaries

**Portable (grammar-worthy structure — no brand):**

- One shared list/detail shell for catalog browsers (not per-route layout forks).
- Idle detail suppressed when list not `ready` (loading/empty/fault) and for browse-first catalogs until selection.
- Never show “Select a…” (or equivalent placeholder) when the master list has zero rows / is loading / faulted.
- Short create stays in detail with list visible; long create leaves the split (full-width).
- Full-page create column centered; create inside detail fills the pane (no orphan left skinny form).
- List column default ~⅓ width with usable resize range (not a starved rail); detail flexes.
- List lifecycle enum drives chrome (toolbar Add only when ready; one empty CTA).
- Icon view-mode + single toolbar band + compact filters + form column cohesion + collapsible sidebar — **already FAIL IDs**.

**Pink-Depot-brand / must NOT leak into grammar:**

- Dusty rose / Satoshi / cream surface / `112.5%` root / OKLCH accent recipes.
- `we__*` class names as rule surface (portable rules should describe structure, not class tokens).
- `localStorage` keys `pink-depot:split-list-pct`, `pink-depot:inventory-view-mode`, `pink-depot:sidebar-collapsed`.
- Placeholder string copy (“Select a vendor…”, “Choose an order…”).
- Domain catalog set (inventory/vendors/orders/purchases) and Products-as-exception IA.
- Exact token values `20rem` / `34%` / clamp 18–55 (ratios/intent portable; literals optional examples only).
- Parallel-routes `@list` Next.js pattern (implementation detail; rule is behavioral).
- `apple-hig-ui.mdc` glass / StatusLabel / rose CTA rules — materials+brand, already separate from structure grammar.

**`apple-hig-ui.mdc` does not encode** split empty/create/list-status rules — only glass, StatusLabel, `we__*` invent ban, accent on primary CTAs, component folders.

---

### Non-Obvious Things

1. **`suppressIdle` is `status !== "ready"`**, not only `empty`. Loading and fault also hide the placeholder — prevents a dead right column beside skeletons/banners.
2. **`idleFullBrowse` is inventory-only**; vendors/orders/purchases still show placeholder when `ready` and nothing selected. Portable rule should distinguish “browse-first catalogs” vs “select-required catalogs,” not ban all idle placeholders.
3. **Evolution of empty signal:** `4d31fc6` introduced boolean `listEmpty`; `9c39fac` replaced with four-state `ListPaneStatus` and gated Add; `1fc3156` renamed browse-primary → `idleFullBrowse` and unified resizable width.
4. **PO create uses `width="full"` inside the split** — sounds like long create, but is still short-create placement (list visible). `width="full"` here means “don’t use 36rem detail cap for a multi-section PO form”; split CSS still fills the detail pane. Grammar should key off **route placement** (excludePaths vs in-detail), not `FormPageChrome` width prop alone.
5. **Products** intentionally no split, but still uses `ListPaneStatus` via chrome’s local provider — status lifecycle is not split-only.
6. **List `min-width: 0`** (no 16rem floor) was an intentional fix: at 768 with sidebar, a floor crushed detail (~129px). Width budget is about **default size + resize**, not a hard min-width floor.
7. **Resizer only mounts when `isDetail`** — idle placeholder mode has no drag handle; dragged `%` applies only while detail is open (`listPct` style gated on `isDetail`).
8. Soft AGENTS line (L12) is the clearest “portable product chrome” brief; DESIGN.md L23 + component table “Don’t: Select a… when list is empty” are the design SoT; grammar.yaml does not yet cover them.

---

### Open Questions

1. Should **browse-first idle** (`idleFullBrowse`) be a separate FAIL ID from **empty/loading/fault hide placeholder**, or one combined “no dead idle detail” rule with two pass modes?
2. Is **shared `CatalogSplitLayout`-style config** a structure FAIL (vs soft DRY preference), or only the user-visible empty/create behaviors?
3. Should grammar require a **named list lifecycle** (`loading|empty|ready|fault`) or only observable outcomes (Add hidden, placeholder hidden, single CTA)?
4. How to phrase **short vs long create** without inventing route lists — e.g. “form field budget / step count” heuristic vs explicit DESIGN.md create-class annotation?
5. Products full-width exception: portable “catalog may opt out of split” — fail only when a catalog **claims** split but violates empty/create rules?
6. Eval strategy: source AST/CSS heuristics vs live screenshot QA for “Select a…” / half-width form — patient already requires live gold for Phase 5.

---

### Candidate FAIL IDs (proposed ids + failWhen/passWhen in one line each)

Already shipped (confirm still match Pink Depot — **yes** for inventory tools / form column / sidebar):

- `chrome.view-mode.icons` — FAIL: text List/Grid as primary glyph; PASS: icon-only segmented, name in aria-label.
- `chrome.list-browser.toolbar-budget` — FAIL: stacked option bands above rows; PASS: one compact toolbar band.
- `chrome.list-browser.filter-density` — FAIL: full-phrase checkbox for simple filter; PASS: compact toggle/chip, phrase in aria-label.
- `chrome.form.column-cohesion` — FAIL: full-bleed header over capped fields / orphan skinny form; PASS: title, actions, fields one column width.
- `chrome.sidebar.collapsible` — FAIL: md+ sidebar fixed expanded only; PASS: collapse/expand affordance.

**Proposed new (currently soft AGENTS/DESIGN only):**

- `chrome.split.empty-no-placeholder` — FAIL: idle “Select a…” (or equivalent) detail pane while catalog is empty, loading, or faulted; PASS: detail omitted / list full-width until list is ready with rows (or a real selection/create).
- `chrome.split.browse-idle-full` — FAIL: browse-first catalog shows empty detail placeholder before any selection; PASS: idle is full-width list/grid until an item is selected (register: product catalogs that declare browse-primary).
- `chrome.split.list-width-budget` — FAIL: list column is a starved thin rail beside large empty/detail whitespace at md+; PASS: default list ~usable title+metadata width (~⅓) and/or user-resizable within a sane clamp; detail flexes.
- `chrome.split.shared-shell` — FAIL: each catalog invents its own split layout/CSS with divergent empty/create behavior; PASS: catalogs share one split shell + config (paths, idle mode, excludes).
- `chrome.create.short-in-detail` — FAIL: short create opens full-page and drops the list, or nests Add→empty “Select a…”; PASS: short create renders in split detail with list still visible.
- `chrome.create.long-fullpage` — FAIL: long/multi-step create trapped in half-width split detail; PASS: long create excluded from split / full-page work surface.
- `chrome.create.fullpage-centered` — FAIL: full-page create column left-orphaned under full-bleed chrome; PASS: create column centered (or intentionally full content width for stepped editors); inside split detail, column fills pane without double max-width.
- `chrome.list-pane.add-when-ready` — FAIL: toolbar Add visible beside empty-state CTA, loading, or fault; PASS: toolbar Add only when list status is ready (and not on an in-flight short-create path).
- `chrome.list-pane.single-empty-cta` — FAIL: duplicate create affordances (toolbar Add + empty CTA + inline half-form) on empty catalog; PASS: exactly one empty-state create CTA owns creation when empty.

**Commit map (requested SHAs):**

| SHA | What changed |
|-----|----------------|
| `5e7904b` | Inventory/shell density: icon List/Grid, single list toolbar band, form column cohesion on creates, collapsible sidebar — seeds of current grammar P0/P1s |
| `4d31fc6` | Empty split panes + half-width add forms: hide idle detail when empty; short creates in detail; center full-page `.we__page--detail`; introduce `SplitListState` (boolean empty) |
| `9c39fac` | Unify `ListPaneStatus` (`loading\|empty\|ready\|fault`); toolbar Add only when ready; products get status via chrome provider; pending/fault reporters |
| `1fc3156` | Unify catalogs into one resizable `CatalogSplitLayout`/`SplitView`; drop per-route split wrappers + browse-primary; `idleFullBrowse` + `split-list-width.ts` |

Adjacent: `b81cdea` refreshed AGENTS.md soft rules to match the above (still prose, not grammar.yaml).
