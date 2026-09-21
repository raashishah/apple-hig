# Changelog

## 0.4.1 — 2026-09-21

Mechanical chrome FAIL gate + recipes so `/hig` is model-proof.

- `scripts/check-chrome.mjs` scans host UI source; P0 hits block `HIG_CHROME` PASS
- Recipes: `knowledge/chrome/recipes.md`
- New FAIL IDs: `chrome.materials.fashion-glass`, `chrome.layout.card-grid-home`, `chrome.ive.nested-cards`
- Round 1 apply = 12 required surfaces from `surfaces.yaml`; optional packs wait until core P0 is clean
- Product + unspecified fonts stay with the host (no hardcoded SF Pro)
- `chrome.list-browser.filter-density` is a required grammar class
- Eval: `eval/run-check-chrome.mjs` plus pass/fail fixtures
- Later catalog goal-loop plan: `docs/plans/2026-09-21-hig-catalog-goal-agent.md` (additive; does not replace `requiredIds`)
- Catalog inventory: `knowledge/catalog.yaml` from Apple's live index (`scripts/sync-hig-catalog.mjs`). Round 1 apply still 12 `requiredIds`. Eval: `eval/run-catalog.mjs`
- Catalog goal loop after chrome P0: `scripts/plan-catalog.mjs` writes `.hig/catalog-status.yaml`. Wave 0 stays `requiredIds`. Then apply remaining packed applicable topics until `remaining` is 0. Brand app-shell rows are `n/a-register`. Watch/TV/Vision skip on web. Pattern `affordance` skips when the host has no matching widget. Same chrome P0 FAILs proven on a web host and a Swift host without naming those stacks in the rule.
- Catalog `failWhen` / `passWhen` derived at load from `grammar.yaml` + pack Do/Don't (not title stubs, not Apply-in-host). Unpackaged rows stay stubs.
- Mechanical apply for dual-stack P0s: `scripts/apply-chrome.mjs` (`chrome.view-mode.icons`, `chrome.bars.system-materials`) on a web host and a Swift host; no kit or font rewrite. Other P0s still use `recipes.md`.
- Mechanical apply for remaining P0 IDs (`toolbar-budget`, `form.column-cohesion`, `fashion-glass`, `card-grid-home`) plus `nested-cards` on tmp copies of `chrome-antipatterns`. Filter-density and sidebar still use `recipes.md`. Committed fixtures stay dirty.
- Mechanical apply for remaining P1 IDs (`filter-density`, `sidebar.collapsible`). `apply-chrome.mjs` now owns every grammar ID. Committed fixtures stay dirty.
- Catalog apply: `scripts/apply-catalog.mjs` accounts packed topics whose `chromeIds` are clean after chrome P0. Pack-only pending topics stay pending. Eval on tmp `chrome-pass` and `chrome-antipatterns`.
- Catalog apply joins pack **Chrome gates** into topic `chromeIds` and accounts pack **Don't** backtick tokens (strip `scaleX(-1)`, map physical margin/padding, no kit). Prose-only Don'ts stay pending. Remaining is not a frozen integer.
- Catalog apply mechanically scans required-surface prose Don'ts (type, color, motion, a11y) and accounts a topic only when every Don't has a scanner. Host fonts stay. Optional packed Don'ts stay pending. Remaining is not a frozen integer.
- Optional widget affordances (`menu`, `picker`, `progress`, `search`, `notification`, `loading`, `feedback`, `onboarding`, `drag`) skip with `skipped-no-affordance` when the host has no matching widget. Search field ≠ Search nav link. `<select>` is a picker, not a menu. Presence without a Don't scanner still stays pending. `requiredIds` stay 12.
- Search Don't heuristics: hide-only-path, spinner-per-keystroke, search-as-settings-dump. chrome-pass search is already-compliant. Unfixable hide-only-path and command-dump stay pending. Do not invent a list. `requiredIds` stay 12.
- Settings and undo skip-unless affordances: hosts without a settings/preferences screen or undo chrome are `skipped-no-affordance`. A form is not Settings. Cancel is not Undo. Presence without a Don't scanner stays pending. Other foundations stay pending. `requiredIds` stay 12.
- Writing Don't heuristics: sarcastic errors that hide the fix, Title Case on long body help, rewritten Sign in/Pay/permission alerts. chrome-pass writing is already-compliant. Unfixable sarcasm and system-alert rewrites stay pending. Title Case help sentence-cases. Do not invent the next step or rewrite brand voice. Other foundations stay pending. `requiredIds` stay 12.
- Privacy Don't heuristics: dark-pattern Allow-only, pre-emptive camera/mic/location on marketing, rewritten or automated system permission/Pay/Sign in. chrome-pass privacy is already-compliant. Hidden Don't Allow unhides. Allow-only and marketing prompts stay pending. Do not invent a decline control or permission copy. Other foundations stay pending. `requiredIds` stay 12.
- Branding Don't heuristics: opaque brand fills on nav/tool/tab bars, watermarks on content, rewriting SF Symbols into a custom outlined set. chrome-pass branding is already-compliant. Watermarks strip. Mixed outlined/system toolbars stay pending. Do not inject a brand kit or rewrite host fonts. Other foundations stay pending. `requiredIds` stay 12.
- Icons / images / app-icons / inclusion Don't heuristics: SF Symbol name tables, outlined doodles next to system symbols, decorative heading icons, screenshot empty-states, bitmap SF Symbols, copied scale-factor tables, Icon Composer templates as law, busy photo app icons, app-icon alpha/mask tricks, diversity stock, ability/body jokes, locked skin-tone defaults. chrome-pass icons/images/app-icons/inclusion are already-compliant. Decorative heading icons, screenshot dumps, and app-icon masks strip. Unfixable tables/bitmaps/templates/jokes stay pending. Design-principles Don'ts stay pending. Do not inject an icon kit or invent copy. `requiredIds` stay 12.
- Optional-widget Don't heuristics: settings, undo, loading, feedback, onboarding, drag, notifications, launching. chrome-pass still skips missing widgets. Clean Settings/Undo hosts are already-compliant. Settings re-theme fills, CRUD confetti, and launch autoplay strip. Unfixable first-run walls, delete confirms, and notification walls stay pending. Do not invent a missing widget. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Chrome-backed Don't heuristics: layout, materials, lists, forms, navigation. chrome-pass those topics are already-compliant. List min-widths, equal-weight submits, list-toolbar CTAs, marketing tab shells, stacked glass, compatibility flags, relative bottom nav, and card-grid masters strip/move. Packs with Don't bullets account through Don't scanners, not clean chromeIds. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Host-widget Don't heuristics: menus, pickers, progress, controls. chrome-pass still skips missing menus/pickers/progress; buttons stay already-compliant. Hidden menu items unhide+dim; overweight wheels become native `<select>`; progress morph/jump/pull-to-refresh titles strip; `OK`+save and submit-toggles rewrite. Nested submenus, mixed menu icons, picker-owned screens, bare steppers, and `OK` without a verb stay pending. Do not invent a field, route, or icon kit. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- System-chrome Don't heuristics: widgets, Live Activities, status bars, Control Center. chrome-pass still skips those gates. Clean capability hosts are already-compliant. Fake in-app widgets, stretched small widgets, Dynamic Island pointers, Live Activity ads, hidden status bars, fake status clocks, opaque status strips, and settings-row Control Center chrome strip. App-icon-as-widget and one-symbol Control Center toggles stay pending. Do not invent a widget kit. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- RTL Don't heuristics: whole-window `scaleX(-1)`, physical `margin-left` / `padding-right`, back chevrons that always point left, `dir="auto"` on `html` or the locale root. chrome-pass right-to-left is already-compliant. Whole-window mirrors, physical chrome margins, `dir="auto"` roots, and `chevron.left` / `chevron-left` back controls rewrite to logical. Unicode `←` back chevrons stay pending. Do not invent a mirrored design file. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Nested-modal Don't heuristics: sheets, alerts, action-sheets, modality. chrome-pass still skips missing overlays. A `data-nested-modal` marker strips. Nested `<dialog>` stacks stay pending without flattening into a missing surface. Do not invent a sheet. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Composed `also:` catalog wiring: dark-mode rides color Don'ts, SF Symbols rides icons Don'ts, context/pull-down/pop-up buttons ride menu Don'ts, notifications glanceability rides managing-notifications Don'ts. No second swarm lease. The Mac menu bar and tab-views stay unpackaged stubs. `requiredIds` stay 12.
- Slider, scroll-view, and popover Don't heuristics from Apple guidance: do not use a slider for audio volume; do not nest same-orientation scroll views; do not cascade popovers, use a popover as a warning, or keep a popover in compact width. chrome-pass still skips missing sliders/scroll panes/popovers. Markers strip. A live volume slider, nested overflow panes, and nested popovers stay pending without inventing a volume view, flattening scroll, or turning a popover into a sheet. `type=range` is not a picker. Document/body overflow is not a scroll view. A sheet `dialog` is not a popover. Do not invent a missing widget. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Collection Don't heuristics from Apple guidance: do not use a custom layout that confuses; do not put a collection of text where a table belongs; do not let collection items overlap. chrome-pass still skips missing collections. A `<ul>` inventory stays a list. Markers strip on a visual `data-collection` with an image. A text-only collection of spans stays pending without inventing a table or flattening into a list. Do not map collections onto lists. Do not invent a missing widget. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Page-control Don't heuristics from Apple guidance: do not use a page control for hierarchical or nonsequential pages; do not show more than about 10 dots; do not use more than two different indicator images; do not color indicator images. chrome-pass still skips missing page controls. A progress bar and numbered pagination stay themselves. Markers strip. A live `numberOfPages={12}` host stays pending without inventing a grid. Do not invent a missing widget. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Label Don't heuristics from Apple guidance: do not use a label for text people need to edit; do not use a label for a large amount of text; do not make useful label text uncopyable. chrome-pass still skips missing static labels. A form `<label>` and `aria-label` stay themselves. Markers strip. A live `contenteditable` label stays pending without inventing a text field. Host fonts stay. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Text-view Don't heuristics from Apple guidance: do not use a text view for a small amount of text; do not make useful text-view text uncopyable. chrome-pass still skips missing text views. An `<input>` stays a field. Markers strip. A live 1-row textarea stays pending without inventing a label. Host fonts stay. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Image-view Don't heuristics from Apple guidance: do not add button behaviors to an image view; do not use an image view for an interface icon; do not overlay text on an image view. chrome-pass still skips missing image views. Every `<img>` stays itself. Markers strip. A live clickable `data-image-view` stays pending without inventing a button. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Chart Don't heuristics from Apple Charts and Charting data: do not rely solely on color; do not hide critical information behind interaction; do not chart data that belongs in a table or list; do not pack a chart with too much data. chrome-pass still skips missing charts. A table and a decorative SVG stay themselves. `charting-data` rides the same pack via `also:`. Markers strip. A live hover-only `data-chart` stays pending without inventing a table. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Disclosure-control Don't heuristics from Apple guidance: do not use more than one disclosure button in a view; do not use a disclosure triangle without a descriptive label; do not show advanced details without hiding them until they're relevant. chrome-pass still skips missing disclosure widgets. An `aria-expanded` toolbar stays itself. Markers strip. A live unlabeled `<details>` stays pending without inventing a summary. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Box Don't heuristics from Apple Boxes: do not nest boxes to define subgroups; do not size a box close to its containing view. Distinct from `chrome.ive.nested-cards` (list/form extra card panels). chrome-pass still skips missing box widgets. A card, grouped list, and form fieldset stay themselves. Markers strip. Live nested `data-box` stays pending without un-nesting. Do not invent a missing box. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Edit-menu Don't heuristics from Apple guidance: do not invent a custom menu that presents the same commands; do not show Cut or Copy when nothing is selected; do not add other controls that perform the same functions. chrome-pass still skips missing edit menus. A command `role="menu"` stays a menu. Markers strip. Live Cut/Copy on `data-edit-menu` without a selection stays pending without inventing dimming. Do not invent Cut, Copy, or Paste. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Offering-help Don't heuristics from Apple guidance: do not tell people to click on iPhone or tap on Mac; do not explain how standard components work; do not put promotional content in a tip. chrome-pass still skips missing tips. Onboarding and a `title=` attribute stay themselves. Markers strip. Live "click on iPhone" help copy stays pending without inventing platform verbs. Do not invent help. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Web-view Don't heuristics from Apple guidance: do not omit forward and back on a multi-page web view; do not replicate Safari. chrome-pass still skips missing web views. The host document stays itself. Markers strip. A live multi-page `iframe` without Back/Forward stays pending without inventing chrome. Do not invent a web view. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Activity-view Don't heuristics from Apple guidance: do not duplicate common share-sheet actions; do not reveal the sheet with an alternative to Share. chrome-pass still skips missing share sheets. A Share nav link stays itself. Markers strip. Live duplicate Print rows stay pending without inventing a custom title. Do not invent a share sheet. Design-principles Don'ts stay pending. `requiredIds` stay 12.
- Printing Don't heuristics from Apple guidance: do not show Print when nothing is printable; do not duplicate system page-orientation options. chrome-pass still skips missing Print actions. A share-sheet Print row stays itself. Markers strip. Live Print on `data-nothing-printable` stays pending without inventing dimming. Do not invent a printer. Design-principles Don'ts stay pending. `requiredIds` stay 12.

## Unreleased

- Live HIG URL hygiene: Toolbars (not `/navigation` or `/navigation-bars`), Gestures, Entering data; ban `/app-intents`
- Glass-safe chrome: `chrome.bars.system-materials` FAILs custom opaque bar fills; do not FAIL missing opaque nav
- Surface gates: optional ids use flat `gate`; preflight `platform` + `capabilities`; skip ≠ synthesizer drop; tech stays off `requiredIds`
- Platform gates: iPad-only `UIDeviceFamily` `[2]`; SwiftUI Mac via `.macOS(`; `multi` / `platform_secondary` include desktop for `mac-chrome`
- Wire Getting Started, foundations, patterns, inputs, system, and tech packs as gated surfaces (`requiredIds` still 12)
- One Siri worker (compose App Shortcuts); sheets compose action sheets; PassKit → wallet not Apple Pay; Control Widget gates Control Center; Pencil is iPad AND pencil
- iPhone Duo Getting started is gated (`duo` / `capability:duo`); current iPhone skips it

## 0.4.0 — 2026-09-12

`/hig` is a **framework-agnostic swarm**, not a React-only implementer.

- Detect SwiftUI / UIKit / web / React / other UI; fail only when there is no UI
- Parallel surface agents (layout, type, color, spacing, motion, controls, nav, lists/split, sheets, forms, a11y)
- Optional `hig-react` mapping skill — no component injection
- Apple canon (`knowledge/canon.md`) + `surfaces.yaml`
- Install via `npx skills add raashishah/apple-hig -g -y`

## 0.3.2 — 2026-07-25

Rename to **upgrade** (not update) and clarify README.

- `/hig upgrade` + skill `hig-upgrade` (say **HIG upgrade**)
- `scripts/upgrade-check.sh` (was update-check) + `scripts/upgrade.sh`
- README: no auto-upgrade; install shapes; how the skill “learns”
- Removes legacy `hig-update` symlink on `./setup`

## 0.3.1 — 2026-07-25

gstack-style self-upgrade (first ship; commands used the word “update”).

- Check/upgrade scripts, `VERSION`, `./setup` dual skill links

## 0.3.0 — 2026-07-25

Public packaging release for feedback.

- Cursor plugin layout (`.cursor-plugin/plugin.json`) ready for marketplace / Git install
- `./setup` installs `/hig` into `~/.cursor/skills/hig`
- Chrome grammar dry eval + brand-veto / unsupported-stack dry evals
- Proof notes from Pink Depot dogfood + admissionsdemo portable run
- Honest gaps list (next chrome FAIL candidates) for early testers

## 0.2.0

- Bare `/hig` = design + implement from existing requirements
- Pattern packs + brand veto + materials arbitration
- Chrome grammar v1 (`chrome.view-mode.icons`, toolbar budget, filter density, form column cohesion, sidebar collapse)
