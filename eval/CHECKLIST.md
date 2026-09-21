# `/hig` portable done checklist

Proof patient: `admissions-app` (admissionsdemo).  
Dogfood product: Pink Depot (see `docs/PROOF.md`).

Do **not** auto-mutate finished designed apps unless the user asks to dogfood.

## Admissionsdemo (live proof)

- [x] `~/.cursor/skills/hig` exists and points at plugin skill root
- [x] Bare `/hig` produced `DESIGN.md` (non-placeholder, Apple-designer prose for this product)
- [x] `.hig/app-design.md` exists (nav model, screens, states)
- [x] `.hig/screens.yaml` lists primary routes/screens
- [x] Same run implemented structure/chrome on primary screens
- [x] Brand tokens/fonts for that app unchanged
- [x] Evidence screenshots @768 and @375 under `.hig/evidence/`
- [x] Product register (not marketing landing chrome)

## Dry harness (no designed-app mutation)

From repo root:

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
node eval/run-swarm.mjs
node eval/run-check-chrome.mjs
node eval/run-catalog.mjs
```

- [x] Sparse fixture: preflight passes; mutation open
- [x] Unsupported fixture: `mutation=unsupported` with one-line stop
- [x] Brand veto: `register: brand` → `review_adapt_mutation=blocked`
- [x] Grammar loads; required chrome rule IDs present (including filter-density + fashion-glass + card-grid-home)
- [x] `fixtures/chrome-antipatterns` covers view-mode, toolbar budget, filter density, form column, sidebar, opaque bars, fashion glass, card-grid home, nested cards
- [x] `check-chrome.mjs` detects those antipatterns and stays quiet on `fixtures/chrome-pass`
- [x] Host fonts stay (no forced SF Pro / system stack)
- [x] `surfaces.yaml` apply SSOT; `requiredIds` stay 12; Duo stays gated
- [x] Packs + SKILL/review/design wire chrome grammar IDs
- [x] All chrome rules are `mutationClass: structure` (brand veto does not hide them)
- [x] `catalog.yaml` tracks the live Apple article index; lists apply on Vue; complications skip on web; `requiredIds` stay 12
- [x] Goal loop: wave 0 is `requiredIds`; after chrome P0 remaining packed catalog topics apply; done when `remaining` is 0; brand app-shell catalog rows are `n/a-register`
- [x] Host-pattern affordance: list/form/overlay/chrome skip when the widget is absent; collection/card grids still count as list
- [x] Optional widget affordance: menu/picker/progress/search/notification/loading/feedback/onboarding/drag skip when absent; Search nav link is not search; `<select>` is picker not menu; remaining is not a frozen integer; `requiredIds` stay 12
- [x] Settings/undo skip-unless: chrome-pass skips both; a Settings screen or Undo control stays pending; a data-entry form is not Settings; Cancel is not Undo; remaining is not a frozen integer
- [x] Search Don't heuristics account search-fields/searching on tmp chrome-pass (already-compliant); spinner-on-keystroke applies; hide-only-path and command-dump stay pending without inventing a list; remaining is not a frozen integer
- [x] Writing Don't heuristics account writing on tmp chrome-pass (already-compliant); Title Case long help sentence-cases; sarcastic errors without a next step and rewritten system alerts stay pending without inventing copy; remaining is not a frozen integer
- [x] Privacy Don't heuristics account privacy on tmp chrome-pass (already-compliant); hidden Don't Allow unhides; Allow-only and marketing camera prompts stay pending without inventing a decline; remaining is not a frozen integer
- [x] Branding Don't heuristics account branding on tmp chrome-pass (already-compliant); watermarks strip; mixed outlined/system toolbars stay pending without injecting a kit; other foundations stay pending; remaining is not a frozen integer
- [x] Icons/images/app-icons/inclusion Don't heuristics account those topics on tmp chrome-pass (already-compliant); decorative heading icons, screenshot empty-states, and app-icon masks strip; outlined doodles and ability jokes stay pending without injecting a kit or inventing copy; design-principles stay pending; remaining is not a frozen integer
- [x] Optional-widget Don't heuristics account settings/undo/loading/feedback/onboarding/drag/notifications/launching when the host has that widget and every Don't has a scanner; chrome-pass still skips missing widgets; clean Settings/Undo are already-compliant; re-theme fills, CRUD confetti, and launch autoplay strip; unfixable walls stay pending; design-principles stay pending; remaining is not a frozen integer
- [x] Chrome-backed Don't heuristics account layout/materials/lists/forms/navigation when every Don't has a scanner; chrome-pass those topics are already-compliant; list min-widths, equal-weight submits, list-toolbar CTAs, marketing tab shells, stacked glass, compatibility flags, relative bottom nav, and card-grid masters apply; packs with Don't bullets account through Don't scanners, not clean chromeIds; design-principles stay pending; remaining is not a frozen integer
- [x] Host-widget Don't heuristics account menus/pickers/progress/controls when every Don't has a scanner; chrome-pass still skips missing menus/pickers/progress; buttons stay already-compliant; hidden menu items, overweight wheels, progress morph/jump/pull titles, OK+save, and submit-toggles apply; nested submenus stay pending without inventing a flatter menu; design-principles stay pending; remaining is not a frozen integer
- [x] Same chrome P0 FAIL on a web host and a Swift host; grammar `failWhen` / `passWhen` do not name frameworks
- [x] Packed catalog topics derive `failWhen` from grammar + pack Do/Don't at load; unpackaged rows stay stubs; no SF Pro / framework names
- [x] Mechanical apply clears the two dual-stack P0s on tmp copies of the web and Swift antipattern hosts; chrome-pass stays clean; no SF Pro/kit; committed fixtures stay dirty
- [x] Mechanical apply clears remaining P0 IDs (and nested-cards) on a tmp copy of `chrome-antipatterns`; filter-density and sidebar may remain; committed fixtures stay dirty
- [x] Mechanical apply clears filter-density and sidebar on a tmp copy of `chrome-antipatterns`; after.fails is empty; committed fixtures stay dirty
- [x] Catalog apply accounts chrome-backed packed topics on tmp chrome-pass (already-compliant) and tmp chrome-antipatterns (applied after chrome fix); pack-only rows stay pending; remaining is not a frozen integer
- [x] Pack Chrome gates join catalog chromeIds (buttons/text-fields); pack Don't code spans apply on a tmp host (`scaleX(-1)` / `margin-left`); tab-views stays a title stub; no SF Pro/kit
- [x] Required-surface prose Don'ts (type/color/motion/a11y) scan/apply/account on tmp chrome-pass and tmp antipattern files; a topic accounts only when every Don't has a scanner; missing optional widgets are skipped-no-affordance; no SF Pro/kit; remaining is not a frozen integer

## Swarm / stack (0.4)

- [x] SwiftUI fixture: mutation open
- [x] Web CSS fixture (no React): mutation open
- [x] Docs-only fixture still unsupported
- [x] Optional hig-react exists and does not inject a kit
- [x] Asset-catalog flood still finds `.swift` (`kind=swiftui`)
- [x] Help HTML next to SwiftUI stays `native-apple`, not `mixed`
- [x] LaunchScreen.storyboard + leftover `.xib` do not force UIKit
