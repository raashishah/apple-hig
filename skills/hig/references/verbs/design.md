# Design (+ swarm implement)

Default `/hig` path. Whole-app Apple HIG from existing requirements, then a **parallel surface swarm** that applies guidelines in the host stack until the UI feels Apple-native.

## When

- Bare `/hig`
- “design the app”, “make it Apple”, “HIG the whole product”

## Preconditions

- `load-context.mjs` → `mutation` is not `unsupported`
- If unsupported: print `stopLine` and stop
- Read `knowledge/canon.md`
- Run `node <skill>/scripts/load-surfaces.mjs`, `node <skill>/scripts/load-chrome-grammar.mjs`, and `node <skill>/scripts/load-catalog.mjs`

## Steps

### 1. Ingest

From context JSON + repo skim (do not invent other products’ brands):

- `requirementPaths`, parent `docs/`, `AGENTS.md`, README, existing routes (`routesHint`)
- Existing brand snapshot (`brandSnapshot`)
- `stack.kind` / `stack.family` (swiftui, uikit, web, react, …)
- `platform` (`phone` / `ipad` / `desktop` / `games` / `unknown`) and `capabilities` (tokens such as `healthkit`)
- `node <skill>/scripts/plan-catalog.mjs --cwd <host>` after preflight (wave-0 vs catalog remaining)
- Infer `register`: `product` for tools/scoreboards/shells; `brand` for marketing/portfolio/landing

Ask **zero** interview questions when enough signal exists. If brand hue is missing, keep a quiet system accent. Do not rewrite fonts.

If `stack.family` is `web` and kind is React/Next, load optional sibling `hig-react` for DOM/ARIA mapping only.

### 2. Write design package

Write/refresh (Apple-designer voice for **this** product):

1. `DESIGN.md` using `references/project/design-md-template.md`
2. `.hig/app-design.md` using `references/project/app-design-template.md`
3. `.hig/screens.yaml` using `references/project/screens-yaml-template.yaml`
4. `.hig/progress.yaml` — screens + swarm round status
5. `.hig/catalog-status.yaml` from `plan-catalog.mjs --write`
6. `.hig/swarm/` directory

On `register: brand`, include:

```text
brand_mutation_veto: spacing_and_touch_targets_locked
```

unless the user explicitly asked to restyle spacing.

### 2.5 Chrome grammar (non-optional for product chrome)

1. Run `node <skill>/scripts/load-chrome-grammar.mjs` and read `knowledge/chrome/grammar.yaml`.
2. Read `knowledge/chrome/review-rubric.md` archetype → gates table and `knowledge/chrome/recipes.md`.
3. For each screen, bind applicable rule IDs (list-browser, form-page, app-shell). Implement so those rules would **PASS**. Soft pack prose is not enough. Run `apply-chrome.mjs`, then remaining recipes, then `check-chrome.mjs`.

### 3. Swarm (same run, parallel)

Do **not** implement serially as a single agent editing all of `src/` at once. Fan out.

**Chrome retries:** at most 3 rounds. That cap is not catalog done.

#### 3a. Audit (parallel)

Launch one Task per **selected** surface: every `requiredIds` id, plus optional ids whose flat `gate` matches preflight (`always`, host family `phone`/`ipad`/`desktop`/`games`/`duo`, or `capability:<token>`).

**Skip** unmatched gated ids — do not launch a worker, do not write `.hig/swarm/<id>.md`. Skip is not a synthesizer drop.

**Drop** is only for a surface that **was launched** and has nothing to mutate.

Use `references/agents/surface-worker.md` (`subagent_type`: `generalPurpose`).

Each worker:

- Reads host UI in its domain
- Writes **only** `.hig/swarm/<surfaceId>.md`
- Does not edit product source
- Cites Apple URLs + `structure:chrome.*` when `failWhen` matches

If the Task tool is unavailable, simulate the swarm yourself: still write one audit file per **selected** surface before any product edit.

#### 3b. Synthesize

Follow `references/agents/synthesizer.md`. Write `.hig/swarm/plan.yaml` with **exclusive file leases**. Drop decoration. Ive test: if a proposal is not simpler/clearer, drop it.

#### 3c. Apply (parallel, leased)

Launch apply Tasks (`references/agents/apply-worker.md`) only for surfaces with files. They edit **leased paths only**, in the host language (SwiftUI/UIKit/CSS/existing components). No React kit injection.

**Wave 0 apply leases = `requiredIds` only.** Optional `gate: always` surfaces may audit; do not apply them until `check-chrome.mjs` reports `pass: true` for required chrome.

Parent agent applies any leftover files that could not be leased. Then run `node <skill>/scripts/check-chrome.mjs`. If P0 remains, run `node <skill>/scripts/apply-chrome.mjs --cwd <host> --write` and re-check. Remaining hits: next chrome round re-applies only failed surfaces using `recipes.md`.

#### 3c-2. Catalog waves (after chrome P0)

When `check-chrome.mjs` `pass` is true, run:

```bash
node <skill>/scripts/apply-catalog.mjs --cwd <host> --write
```

That accounts packed topics whose `chromeIds` are clean (including pack **Chrome gates**), pack **Don't** code spans, and required-surface prose Don'ts whose every bullet has a mechanical scanner. Apply remaining pending `waveTopicIds` (optional prose-only Don'ts) with the same leased apply workers. Map each catalog topic onto the host’s existing widgets. Do not inject a kit or a missing control. Topics in the plan with `skipped-no-pack` / `skipped-gate` / `n/a-register` / `skipped-no-affordance` / `applied` / `already-compliant` are accounted — do not invent UI for them. Human-only packs (Apple Pay capture, Sign in consent, biometrics) style chrome around system sheets only.

If `done` is false, persist `.hig/catalog-status.yaml`, mark applied topics, and run `plan-catalog.mjs` again. Do not print catalog done after only 12 surfaces.

#### 3d. Gold QA

Follow `references/verbs/review.md` (report). Use `references/agents/gold-qa-reviewer.md` at:

- Web: **768** and **375**
- Native: compact and regular width

If P0 `structure:chrome.*` remains (review **or** `check-chrome.mjs`) and mutation is open, start the next **chrome** round (re-audit failed surfaces only). If chrome is clean and catalog `remaining` > 0, continue catalog waves.

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
- Do not emit `HIG_CHROME` PASS while `check-chrome.mjs` reports P0 fails.

## Done shape

```text
HIG_DESIGN: register=<product|brand> screens=<n> stack=<kind>
HIG_SWARM: round=<n> surfaces=<n> applied=<n>
HIG_CHROME: gates=<n> passed=<n>
HIG_CATALOG: applicable=<n> remaining=<n> phase=<chrome|catalog>
HIG_BRAND: preserved|updated-per-design
HIG_EVIDENCE: wide=<path|pending> compact=<path|pending>
HIG_IVE: simpler=yes|no native=yes|no
```
