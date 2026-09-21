---
title: HIG catalog goal agent - Plan
type: feat
date: 2026-09-21
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: knowledge-work
jev: jev-1.13.0
---

# HIG catalog goal agent - Plan

Locked-lane catalog plan. It does **not** change apply on main until merge. PR #12 now carries chrome, host fonts, catalog inventory, and the after-chrome goal loop. Jev `plan_doc_shape=one_page_locked_lane` (0.98).

Jev (`jev-1.13.0`): `apply_ssot=surfaces_yaml_requiredIds_12` (1.0); `catalog_loop_relation=additive_later` (1.0, U2 now landed additive on this PR); `fonts_this_pr=leave_host` (1.0). Remove `requiredIds` later noul 0.17. Watch/TV/Vision now noul 0.08. Lists on Vue/Flutter noul 0.87. TypeSafe is not a `/hig` runtime. Jev `next_unit=finish_eval_docs_commit` (0.53); `mark_goal_complete_after_u2` noul 0.08.

## Locked apply (already on main)

- Apply SSOT is `skills/hig/knowledge/surfaces.yaml`.
- `requiredIds` stay 12 (layout … accessibility). Round 1 apply is that set until `check-chrome.mjs` is P0-clean.
- Optional surfaces stay gated. iPhone Duo is `gs-iphone-duo` (`duo` / `capability:duo`), not required.
- `registry.yaml` is rare-leaf Apple URLs only. Do not revive it as the apply catalog.
- Watch / TV / Vision stay out.
- Packs for foundations, patterns, components, inputs, Mac, games, and tech are already on main via #10.
- Human-only: Apple Pay capture, Sign in with Apple consent, biometrics. Style chrome around those sheets; do not complete them.

## This PR (#12)

Mechanical chrome gate + recipes. Host fonts stay (no SF Pro / `-apple-system` rewrite as success). Framework-agnostic design rules map onto the host stack. Any-model round 1 remains the 12 `requiredIds`. U1 catalog inventory (`knowledge/catalog.yaml`) is additive and is not the apply SSOT. U2 goal loop (`scripts/plan-catalog.mjs`) runs after chrome P0: remaining packed applicable topics, persist `.hig/catalog-status.yaml`, stop when remaining is 0. U4 host-pattern skip (`skipped-no-affordance`). U5 same chrome P0 on web + Swift hosts. Catalog `failWhen` derived at load from grammar + pack Do/Don't. Mechanical apply (`apply-chrome.mjs`) for every grammar ID. Catalog apply (`apply-catalog.mjs`) accounts chrome-backed packed topics whose pack has no Don't bullets, pack Don't code spans, and required-surface prose Don'ts. Optional widget affordances skip missing menus/pickers/progress/search/notifications/loading/feedback/onboarding/drag/settings/undo. Writing Don'ts account when every bullet has a scanner. Chrome-backed layout/materials/lists/forms/navigation Don'ts account when every bullet has a scanner. Visual any-host Apple-ness is still unproven.

## Additive catalog loop

Ingest Apple's **live** HIG index into derived records (`id`, URL, framework-free `failWhen` / `passWhen`, `appliesWhen`). No frozen topic count. Refresh on `/hig upgrade`.

Wave 0 stays the 12 `requiredIds` until required chrome is P0-clean. Then apply **matching** catalog topics (host has the pattern or platform). Lists apply on Vue/Flutter. Complications do not apply to a web host. Skip unmatched Watch/TV/Vision.

Do not delete `requiredIds`. Do not replace `surfaces.yaml`. Keep `check-chrome.mjs` as P0 for solved IDs. Jev classifies topics at plugin-build time only.

## Do not hardcode (later loop)

| Forbidden | Instead |
|---|---|
| Topic count as a pass integer | Diff against the live Apple index |
| Font stacks as success | Host face stays; type rules are hierarchy, ramp, roles, readability |
| Framework names as `passWhen` | Design rule; mapping from detected stack |
| JS copies of yaml id lists | Load ids from `grammar.yaml` / catalog records |

Playbook data (Apple URL + design rule) is allowed. Frozen policy in code is not.

## Sequence

1. U1. Ingest live Apple index → derived catalog records. Eval tracks the index, not a number. **Landed on this PR.**
2. U2. Goal loop **after** wave-0 `requiredIds`. Applicable set is extra work, not a replacement stop condition. **Landed on this PR** (`plan-catalog.mjs` + `eval/run-catalog.mjs` loop cases).
3. U3. Host fonts already left alone on #12. Keep that.
4. U4. `appliesWhen` from host patterns (scan list, form, overlay, chrome), not a framework enum. **Landed on this PR** (`affordance` on `surfaces.yaml`; `skipped-no-affordance`).
5. U5. Same design FAIL proven on two detected stacks without naming those stacks in the rule. **Landed on this PR** (`chrome-antipatterns-web` + `chrome-antipatterns-swift`).
6. Catalog `failWhen` / `passWhen` derived at load from `grammar.yaml` + pack Do/Don't. **Landed on this PR.** Unpackaged rows stay stubs.
7. Mechanical apply for the two dual-stack P0s (`apply-chrome.mjs`) so any model does not have to invent those recipes. **Landed on this PR.**
8. Mechanical apply for remaining P0 grammar IDs (and `nested-cards`). **Landed on this PR.**
9. Mechanical apply for remaining P1 IDs (filter-density, sidebar). **Landed on this PR.** `apply-chrome.mjs` owns every grammar ID.
10. Catalog apply accounts chrome-backed packed topics (`apply-catalog.mjs`). **Landed on this PR.** Pack-only pending topics remain.
11. Pack **Chrome gates** join catalog `chromeIds`; pack **Don't** code spans apply/account. **Landed on this PR.** Prose-only Don'ts stay pending.
12. Required-surface prose Don't heuristics (type, color, motion, a11y). Account only when every Don't is mechanically checkable. **Landed on this PR.** Optional packed Don'ts stay pending.
13. Optional widget affordance skip (menu, picker, progress, search, notification, loading, feedback, onboarding, drag). **Landed on this PR.** Hosts that have the widget still need Don't apply.
14. Search Don't heuristics. **Landed on this PR.** Account search-fields/searching when every Don't is checkable. Do not invent a browse list.
15. Settings and undo skip-unless affordance. **Landed on this PR.** Do not invent Settings or Undo.
16. Writing Don't heuristics. **Landed on this PR.** Account writing when every Don't is checkable. Do not invent the next step or rewrite brand voice.
17. Privacy Don't heuristics. **Landed on this PR.** Account privacy when every Don't is checkable. Do not invent a decline control.
18. Branding Don't heuristics. **Landed on this PR.** Account branding when every Don't is checkable. Do not inject a brand kit. Other foundation Don'ts wait.
19. Icons / images / app-icons / inclusion Don't heuristics. **Landed on this PR.** Account those topics when every Don't is checkable. Do not inject an icon kit or invent inclusive copy. Design-principles Don'ts stay pending (pack-authoring: Watch/TV/Vision coverage, house taste).
20. Optional-widget Don't heuristics (settings, undo, loading, feedback, onboarding, drag, notifications, launching). **Landed on this PR.** Account those topics when every Don't is checkable and the host has that widget. Skip-unless affordance stays. Do not invent a missing widget. Menus/pickers/progress still have no Don't section. Design-principles Don'ts stay pending.
21. Chrome-backed Don't heuristics (layout, materials, lists, forms, navigation). **Landed on this PR.** Account those topics when every Don't is checkable. Packs with Don't bullets account through Don't scanners, not clean chromeIds. Do not fake-account design-principles. Visual any-host Apple-ness is still unproven.
22. Host-widget Don't heuristics (menus, pickers, progress, controls). **Landed on this PR.** Account those topics when every Don't is checkable and the host has that widget. Skip-unless affordance stays. Do not invent a missing menu, picker, field, or route. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
23. System-chrome Don't heuristics (widgets, Live Activities, status bars, Control Center). **Landed on this PR.** Account those topics when every Don't is checkable and the host has that capability. Capability skip stays. Do not invent a widget kit. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
24. RTL Don't heuristics (right-to-left). **Landed on this PR.** Account that topic when every Don't is checkable. Whole-window `scaleX(-1)`, physical `margin-left`/`padding-right`, `dir="auto"` on the locale root, and `chevron.left` back controls rewrite to logical. Unicode `←` back chevrons stay pending. Do not invent a mirrored design file. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
25. Nested-modal Don't heuristics (sheets, alerts, action-sheets, modality). **Landed on this PR.** Account those topics when every Don't is checkable and the host has an overlay. Skip-unless overlay affordance stays. `data-nested-modal` strips. Nested `<dialog>` stacks stay pending without inventing a sheet. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
26. Composed `also:` catalog wiring. **Landed on this PR.** Dark Mode, SF Symbols, context/pull-down/pop-up menus, and notifications glanceability ride existing complete Don't packs. No second swarm lease. The Mac menu bar and tab-views stay unpackaged. Watch/TV/Vision stay unpackaged. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
27. Slider, scroll-view, and popover packs. **Landed on this PR.** Account those topics when every Don't has a scanner and the host has that widget. Skip-unless `slider` / `scroll` / `popover` affordances stay. Volume sliders, same-axis nested overflow, and compact/cascade/warning popovers scan from Apple pages. Do not invent a missing slider, scroll pane, or popover. Do not map sliders onto pickers, document scroll onto scroll-views, or sheets onto popovers. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
28. Collections pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a collection widget. Skip-unless `collection` affordance stays. Custom confusing layouts, text collections that should be tables, and overlapping items scan from Apple's collections page. Do not invent a missing collection. Do not map collections onto lists: a `<ul>` inventory stays a list; a visual row/grid (`data-collection`, `UICollectionView`, `LazyVGrid`) is a collection. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
29. Page-controls pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a page-control widget. Skip-unless `pagecontrol` affordance stays. Hierarchical/nonsequential pages, more than about 10 dots, more than two indicator images, and colored indicators scan from Apple's page-controls page. Do not invent a missing page control. Do not map page controls onto progress bars, tab bars, or numbered pagination. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
30. Labels pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a static label widget. Skip-unless `label` affordance stays. Editable labels, large-amount labels, and uncopyable useful text scan from Apple's labels page. Do not invent a missing label. Do not map labels onto form `<label>`, `aria-label`, or every string. Host fonts stay. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
31. Text-views pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a text-view widget. Skip-unless `textview` affordance stays. Short text views that belong in a label or field, and uncopyable useful text, scan from Apple's text-views page. Do not invent a missing text view. Do not map text views onto `<input>`, form `<label>`, or document body. Host fonts stay. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
32. Image-views pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has an image-view widget. Skip-unless `imageview` affordance stays. Button behaviors, interface-icon image views, and text overlays scan from Apple's image-views page. Do not invent a missing image view. Do not map image views onto every `<img>` or SF Symbol. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
33. Charts pack. **Landed on this PR.** Account Charts and Charting data when every Don't has a scanner and the host has a chart widget. Skip-unless `chart` affordance stays. Color-only series, hover-only critical values, charts that should be tables, and overcrowded plots scan from Apple's Charts and Charting data pages. `charting-data` rides the same pack via `also:`. Do not invent a missing chart. Do not map charts onto `<table>` or decorative `<svg>`. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
34. Disclosure-controls pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a disclosure widget. Skip-unless `disclosure` affordance stays. Extra disclosure buttons, unlabeled triangles, and unhidden advanced details scan from Apple's disclosure-controls page. Do not invent a missing disclosure control. Do not map disclosure onto a menu, picker, or `aria-expanded` toolbar. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
35. Boxes pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a dedicated box widget. Skip-unless `box` affordance stays. Nested boxes and oversized boxes scan from Apple's boxes page. Distinct from `chrome.ive.nested-cards` (list/form extra card panels). Do not invent a missing box. Do not map boxes onto cards, grouped lists, or form fieldsets. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
36. Edit-menus pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a real edit menu. Skip-unless `editmenu` affordance stays. Custom duplicates, Cut/Copy with no selection, and redundant edit controls scan from Apple's edit-menus page. Do not invent Cut, Copy, or Paste. Do not map edit menus onto a command `role="menu"` or the Mac menu bar. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
37. Offering-help pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a tip, tooltip, or help overlay. Skip-unless `help` affordance stays. Wrong-platform verbs, standard-component tutorials, and promotional tips scan from Apple's offering-help page. Do not invent help. Do not map offering-help onto onboarding or a `title=` attribute. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
38. Web-views pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has an embedded web view. Skip-unless `webview` affordance stays. Missing forward/back on multi-page embeds and Safari replicas scan from Apple's web-views page. Do not invent Back or Forward. Do not map web-views onto the host document. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
39. Activity-views pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a share sheet. Skip-unless `activityview` affordance stays. Duplicate common actions and alternative reveal controls scan from Apple's activity-views page. Do not invent a Share button. Do not map activity-views onto a Share nav link. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.
40. Printing pack. **Landed on this PR.** Account that topic when every Don't has a scanner and the host has a dedicated Print action. Skip-unless `print` affordance stays. Print-when-nothing-printable and duplicate page-orientation scan from Apple's printing page. Do not invent a printer or dimming. Do not map printing onto a share-sheet Print row. Design-principles Don'ts stay pending. Visual any-host Apple-ness is still unproven.

## Non-goals

- A widget kit
- TypeSafe at `/hig` apply time
- Failing backends for having no UI
- Authoring Watch/TV/Vision apply surfaces in the first catalog PR
- Merging PR #12 unless asked
- Touching `raashishah.github.io` or Dreamachine

## Verify (this PR)

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
node eval/run-swarm.mjs
node eval/run-check-chrome.mjs
node eval/run-catalog.mjs
```

`run-swarm.mjs` still requires `requiredIds.length === 12` and Duo off that list. Dry eval: no `appleTypeDefault` / `type_default=apple`. `run-catalog.mjs`: live-index diff with no expected integer; list host applicable for Lists; web host not applicable for complications; fail if a topic `passWhen` names a framework or a font family; wave 0 then catalog; remaining 0 is done; brand app-shell rows `n/a-register`; contract does not stop at twelve; missing host widgets (required patterns and optional menu/picker/progress/search/notification/loading/feedback/onboarding/drag/settings/undo/slider/scroll/popover/collection/pagecontrol/label/textview/imageview/chart/disclosure/box/editmenu/help/webview/activityview/print) are `skipped-no-affordance`; `apply-catalog.mjs` accounts chrome-backed packed topics, pack Don't code spans, and required-surface prose Don'ts on tmp hosts without freezing remaining as an integer. `run-check-chrome.mjs`: same P0 FAILs on `chrome-antipatterns-web` and `chrome-antipatterns-swift`; `apply-chrome.mjs --write` on tmp copies of those hosts and of `chrome-antipatterns` clears owned P0s and is a no-op on `chrome-pass`; committed fixtures stay dirty.
