# Design (+ swarm implement)

Default `/hig` path. Whole-app Apple HIG from existing requirements, then a **parallel surface swarm** that applies guidelines in the host stack until the UI feels Apple-native.

## When

- Bare `/hig`
- “design the app”, “make it Apple”, “HIG the whole product”

## Preconditions

- `load-context.mjs` → `mutation` is not `unsupported`
- If unsupported: print `stopLine` and stop
- Read `knowledge/canon.md`
- Run `node <skill>/scripts/load-surfaces.mjs` and `node <skill>/scripts/load-chrome-grammar.mjs`

## Steps

### 1. Ingest

From context JSON + repo skim (do not invent other products’ brands):

- `requirementPaths`, parent `docs/`, `AGENTS.md`, README, existing routes (`routesHint`)
- Existing brand snapshot (`brandSnapshot`)
- `stack.kind` / `stack.family` (swiftui, uikit, web, react, …)
- Infer `register`: `product` for tools/scoreboards/shells; `brand` for marketing/portfolio/landing

Ask **zero** interview questions when enough signal exists. If brand tokens are missing, pick calm defaults from existing assets or a neutral system stack and record them in `DESIGN.md`.

If `stack.family` is `web` and kind is React/Next, load optional sibling `hig-react` for DOM/ARIA mapping only.

### 2. Write design package

Write/refresh (Apple-designer voice for **this** product):

1. `DESIGN.md` using `references/project/design-md-template.md`
2. `.hig/app-design.md` using `references/project/app-design-template.md`
3. `.hig/screens.yaml` using `references/project/screens-yaml-template.yaml`
4. `.hig/progress.yaml` — screens + swarm round status
5. `.hig/swarm/` directory

On `register: brand`, include:

```text
brand_mutation_veto: spacing_and_touch_targets_locked
```

unless the user explicitly asked to restyle spacing.

### 2.5 Chrome grammar (non-optional for product chrome)

1. Run `node <skill>/scripts/load-chrome-grammar.mjs` and read `knowledge/chrome/grammar.yaml`.
2. Read `knowledge/chrome/review-rubric.md` archetype → gates table.
3. For each screen, bind applicable rule IDs (list-browser, form-page, app-shell). Implement so those rules would **PASS**. Soft pack prose is not enough.

### 3. Swarm (same run, parallel)

Do **not** implement serially as a single agent editing all of `src/` at once. Fan out.

**Round cap:** 3. Stop early on gold PASS.

#### 3a. Audit (parallel)

Launch one Task per surface in `surfaces.yaml` (`subagent_type`: `generalPurpose`) with `references/agents/surface-worker.md`.

Each worker:

- Reads host UI in its domain
- Writes **only** `.hig/swarm/<surfaceId>.md`
- Does not edit product source
- Cites Apple URLs + `structure:chrome.*` when `failWhen` matches

If the Task tool is unavailable, simulate the swarm yourself: still write one audit file per surface before any product edit.

#### 3b. Synthesize

Follow `references/agents/synthesizer.md`. Write `.hig/swarm/plan.yaml` with **exclusive file leases**. Drop decoration. Ive test: if a proposal is not simpler/clearer, drop it.

#### 3c. Apply (parallel, leased)

Launch apply Tasks (`references/agents/apply-worker.md`) only for surfaces with files. They edit **leased paths only**, in the host language (SwiftUI/UIKit/CSS/existing components). No React kit injection.

Parent agent applies any leftover files that could not be leased.

#### 3d. Gold QA

Follow `references/verbs/review.md` (report). Use `references/agents/gold-qa-reviewer.md` at:

- Web: **768** and **375**
- Native: compact and regular width

If P0 `structure:chrome.*` remains and mutation is open, start the next round (re-audit failed surfaces only).

### 4. Evidence

- Capture or describe UI at the viewports above.
- Save under `.hig/evidence/` when screenshots are available.
- Confirm brand snapshot keys still match (or document intentional token renames).

## Hard rules

- No teach/craft section-id loop.
- No glass on nav/bottom bar/content cards by default.
- List columns = browsers; detail owns large title.
- Do not force app chrome onto brand landings.
- Do not copy Warehouse / personal-site tokens into this project.
- Do not add a parallel component library.

## Done shape

```text
HIG_DESIGN: register=<product|brand> screens=<n> stack=<kind>
HIG_SWARM: round=<n> surfaces=<n> applied=<n>
HIG_CHROME: gates=<n> passed=<n>
HIG_BRAND: preserved|updated-per-design
HIG_EVIDENCE: wide=<path|pending> compact=<path|pending>
HIG_IVE: simpler=yes|no native=yes|no
```
