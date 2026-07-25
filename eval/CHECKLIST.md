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
```

- [x] Sparse fixture: preflight passes; mutation open
- [x] Unsupported fixture: `mutation=unsupported` with one-line stop
- [x] Brand veto: `register: brand` → `review_adapt_mutation=blocked`
- [x] Grammar loads; four required chrome rule IDs present
- [x] `fixtures/chrome-antipatterns` covers view-mode, toolbar budget, filter density, form column, sidebar
- [x] Packs + SKILL/review/design wire chrome grammar IDs
- [x] All chrome rules are `mutationClass: structure` (brand veto does not hide them)
