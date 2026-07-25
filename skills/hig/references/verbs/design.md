# Design (+ implement)

Default `/hig` path. Whole-app Apple-designer package from existing requirements, then serial UI implement.

## When

- Bare `/hig`
- “design the app”, “make it Apple”, “HIG the whole product”

## Preconditions

- `load-context.mjs` → `mutation` is not `unsupported`
- If unsupported: print `stopLine` and stop

## Steps

### 1. Ingest

From context JSON + repo skim (do not invent other products’ brands):

- `requirementPaths`, parent `docs/`, `AGENTS.md`, README, existing routes (`routesHint`)
- Existing CSS brand snapshot (`brandSnapshot`)
- Infer `register`: `product` for tools/scoreboards/shells; `brand` for marketing/portfolio/landing

Ask **zero** interview questions when enough signal exists. If brand tokens are totally missing, pick calm defaults from existing CSS or a neutral system stack and record them in `DESIGN.md`.

### 2. Write design package

Write/refresh (Apple-designer voice for **this** product):

1. `DESIGN.md` using `references/project/design-md-template.md`
2. `.hig/app-design.md` using `references/project/app-design-template.md`
3. `.hig/screens.yaml` using `references/project/screens-yaml-template.yaml`
4. `.hig/progress.yaml` — one entry per screen, status `designed` then `implemented`

On `register: brand`, include:

```text
brand_mutation_veto: spacing_and_touch_targets_locked
```

unless the user explicitly asked to restyle spacing.

### 2.5 Chrome grammar (non-optional for product chrome)

1. Run `node <skill>/scripts/load-chrome-grammar.mjs` and read `knowledge/chrome/grammar.yaml`.
2. Read `knowledge/chrome/review-rubric.md` archetype → gates table.
3. For each screen, bind applicable rule IDs (list-browser, form-page, app-shell). Implement so those rules would **PASS**. Soft pack prose is not enough.

### 3. Implement (same run)

1. Load pattern packs needed for the screens (navigation, lists/detail, forms, sheets, layout, materials). Packs’ `## Chrome gates` cite rule IDs only.
2. Implement **serially** by `.hig/screens.yaml` order. Never parallel-edit `src/`.
3. Structure only: chrome hierarchy, list/detail, toolbars, materials, hit targets where product register allows. Satisfy bound chrome grammar rules.
4. Bind to existing CSS variables. Do **not** replace `--bg`/`--fg`/font families unless `DESIGN.md` explicitly changes them in this run’s design step.
5. Update `.hig/progress.yaml` per screen (`implemented`).
6. Optional: merge notes under `.hig/specs/<screen-id>.md`.

### 4. Evidence

- Capture or describe UI at **768** and **375** for primary screen(s).
- Save under `.hig/evidence/` when screenshots are available.
- Confirm brand snapshot keys still match (or document intentional token renames).

## Hard rules

- No teach/craft section-id loop.
- No glass on nav/bottom bar/content cards by default.
- List columns = browsers; detail owns large title.
- Do not force app chrome onto brand landings.
- Do not copy Warehouse / personal-site tokens into this project.

## Done shape

```text
HIG_DESIGN: register=<product|brand> screens=<n> implemented=<n>
HIG_CHROME: gates=<n> passed=<n>
HIG_BRAND: preserved|updated-per-design
HIG_EVIDENCE: 768=<path|pending> 375=<path|pending>
```
