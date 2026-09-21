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
- [x] Same chrome P0 FAIL on a web host and a Swift host; grammar `failWhen` / `passWhen` do not name frameworks
- [x] Packed catalog topics derive `failWhen` from grammar + pack Do/Don't at load; unpackaged rows stay stubs; no SF Pro / framework names
- [x] Mechanical apply clears the two dual-stack P0s on tmp copies of the web and Swift antipattern hosts; chrome-pass stays clean; no SF Pro/kit; committed fixtures stay dirty
- [x] Mechanical apply clears remaining P0 IDs (and nested-cards) on a tmp copy of `chrome-antipatterns`; filter-density and sidebar may remain; committed fixtures stay dirty
- [x] Mechanical apply clears filter-density and sidebar on a tmp copy of `chrome-antipatterns`; after.fails is empty; committed fixtures stay dirty
- [x] Catalog apply accounts chrome-backed packed topics on tmp chrome-pass (already-compliant) and tmp chrome-antipatterns (applied after chrome fix); pack-only rows stay pending; remaining is not a frozen integer

## Swarm / stack (0.4)

- [x] SwiftUI fixture: mutation open
- [x] Web CSS fixture (no React): mutation open
- [x] Docs-only fixture still unsupported
- [x] Optional hig-react exists and does not inject a kit
- [x] Asset-catalog flood still finds `.swift` (`kind=swiftui`)
- [x] Help HTML next to SwiftUI stays `native-apple`, not `mixed`
- [x] LaunchScreen.storyboard + leftover `.xib` do not force UIKit
