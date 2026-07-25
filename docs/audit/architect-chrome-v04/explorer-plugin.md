# Explorer findings: HIG plugin internals

Angle: how `/hig` encodes chrome rules, routes design/review/adapt, proves FAILs in eval, and what is deliberately not encoded yet.

Plugin root: `/Users/raash/Documents/Apple HIG/hig-plugin/` (git repo packaging as `raashishah/apple-hig`). Skill install target: `~/.cursor/skills/hig` → `hig-plugin/skills/hig` (verified symlink).

---

### Components Found

| Component | Path | Role |
|---|---|---|
| Skill entry / router | `skills/hig/SKILL.md` | Frontmatter `name: hig`, `user-invocable: true`, `argument-hint: "[review\|adapt] [target]"`. Thin command table + shared laws + default pipeline. |
| Verb: design (default) | `skills/hig/references/verbs/design.md` | Bare `/hig`: ingest → design package → chrome bind → serial implement → evidence. |
| Verb: review | `skills/hig/references/verbs/review.md` | Report-only gold QA @768/375; cite `structure:chrome.*`; never auto-fix. |
| Verb: adapt | `skills/hig/references/verbs/adapt.md` | One-surface structural fix when mutation open; brand veto hard-stop on spacing/touch. |
| Deprecated verbs | `references/verbs/teach.md`, `craft.md` | Explicit “do not route users”; historical only. |
| Chrome SSOT | `skills/hig/knowledge/chrome/grammar.yaml` | `version: 1`; 5 rules with `id`, `severity`, `mutationClass`, `registers`, `packs`, `appleUrl`, `failWhen`, `passWhen`. |
| Review rubric | `skills/hig/knowledge/chrome/review-rubric.md` | Report shape; archetype → default gates table; veto rules. |
| Chrome README | `skills/hig/knowledge/chrome/README.md` | Packs cite IDs only; review emits `structure:<id>`. |
| Pattern packs (cite IDs) | `knowledge/packs/patterns-lists-detail.md`, `patterns-forms.md`, `patterns-navigation.md`, `foundations-layout.md` (+ materials/color/typography/sheets without chrome FAIL IDs) | Soft Apple guidance + `## Chrome gates` listing IDs only. |
| URL registry | `knowledge/registry.yaml` | Deep Apple HIG URLs for rare leaves; not chrome FAIL SSOT. |
| Preflight script | `skills/hig/scripts/load-context.mjs` | Full JSON stdout: stack, register, brand veto, mutation, brandSnapshot, routesHint, `.hig` presence, `HIG_PREFLIGHT`. |
| Grammar loader | `skills/hig/scripts/load-chrome-grammar.mjs` | Parses YAML subset; builds `byId`/`byPack`; enforces `REQUIRED_CLASSES` (4 IDs — omits filter-density). |
| Brand snapshot | `skills/hig/scripts/brand-snapshot-check.mjs` | Diffs CSS vars/fonts vs `.hig/brand-snapshot.json`; not wired into dry evals. |
| Gold QA agent prompt | `references/agents/gold-qa-reviewer.md` | Outside-voice reviewer; requires `structure:chrome.…` IDs. |
| Design templates | `references/project/design-md-template.md`, `app-design-template.md`, `screens-yaml-template.yaml`, `agents-md-delta.md` | Patient-side artifacts `/hig` writes. |
| Plugin manifest | `.cursor-plugin/plugin.json` | `name: apple-hig`, `version: 0.3.0`, `skills: "./skills/"`. |
| Setup | `setup` (bash) | `ln -sfn skills/hig → ~/.cursor/skills/hig`. |
| Eval: preflight | `eval/run-dry.mjs` | Fixtures: sparse / unsupported / brand-veto. |
| Eval: chrome | `eval/run-chrome-grammar.mjs` | Grammar load + antipattern coverage + structure-mutation-class. |
| Antipattern fixtures | `eval/fixtures/chrome-antipatterns/{manifest.yaml,expected.json,surfaces/*.tsx}` | Annotated bad UI examples; **not** AST-scanned for FAIL detection. |
| Proof / gaps | `docs/PROOF.md`, `README.md` “Status — honest”, `CHANGELOG.md` | Documented dogfood + deliberate non-encoding. |

**Grammar rules (exact IDs in `grammar.yaml`):**

1. `chrome.view-mode.icons` — P0, `mutationClass: structure`, `registers: [product, any]`, packs: `patterns-lists-detail`
2. `chrome.list-browser.toolbar-budget` — P0, structure, `[product, any]`, `patterns-lists-detail`
3. `chrome.list-browser.filter-density` — P1, structure, `[product, any]`, `patterns-lists-detail`
4. `chrome.form.column-cohesion` — P0, structure, `[product, any]`, packs: `patterns-forms`, `foundations-layout`
5. `chrome.sidebar.collapsible` — P1, structure, `registers: [product]` only (no `any`/`brand`), packs: `patterns-navigation`, `foundations-layout`

**Key abstractions:**

- `mutationClass: structure` — all 5 rules; brand veto must not suppress FAIL *reports*.
- `registers: [product|any|brand]` — review rubric skips `registers: [product]` on brand surfaces (sidebar).
- `brandVeto` / `reviewAdaptMutation` — from `register === "brand"` OR `brand_mutation_veto: spacing_and_touch_targets_locked` in DESIGN.md (`load-context.mjs` L125–129, L224, L249).
- `mutation` vs `reviewAdaptMutation` — design may still `mutation=open` on brand; review/adapt get `blocked` for spacing/touch CSS.
- Chrome cite format: `structure:<rule.id>` e.g. `structure:chrome.view-mode.icons` (SKILL L46; review.md L42–44; review-rubric L21).

---

### Flow

#### Entry: `/hig` → SKILL.md

1. Agent resolves skill root (directory of `SKILL.md`).
2. **Mandatory preflight:** `node <skill>/scripts/load-context.mjs` → consume full JSON (SKILL.md L28–38).
3. If `mutation=unsupported`, print `stopLine` and stop.
4. Route by invoke:
   - bare `/hig` → `references/verbs/design.md`
   - `/hig review …` → `review.md`
   - `/hig adapt …` → `adapt.md`
5. Emit `HIG_PREFLIGHT: <value from JSON>`.

#### Bare `/hig` (`design.md`)

1. Ingest: context JSON + repo skim (`requirementPaths`, `brandSnapshot`, `routesHint`); infer `register` product vs brand; zero interview when signal exists.
2. Write patient artifacts:
   - `DESIGN.md` (from `design-md-template.md`; on brand, include `brand_mutation_veto: spacing_and_touch_targets_locked`)
   - `.hig/app-design.md`, `.hig/screens.yaml`, `.hig/progress.yaml`
3. **Chrome bind (non-optional for product chrome):** run `load-chrome-grammar.mjs`; read `review-rubric.md` archetype→gates; bind rule IDs per screen; implement to PASS (design.md L44–48).
4. Implement serially by screens.yaml (never parallel-edit `src/`); load packs; kit-lock to project CSS vars; update progress.
5. Evidence @768/@375 under `.hig/evidence/`; done shape `HIG_DESIGN` / `HIG_CHROME` / `HIG_BRAND` / `HIG_EVIDENCE`.

#### `/hig review`

1. Preflight; stop if unsupported.
2. Hard stop if `reviewAdaptMutation=blocked` OR `register=brand` OR `brandMutationLocked=true`: report only; no spacing/touch CSS edits (review.md L15–21).
3. Load grammar + rubric (+ packs); inspect UI @768/375; optional Task with `gold-qa-reviewer.md`.
4. Match `failWhen`; emit `structure:<rule.id>`; FAIL if any checked P0 matches.
5. Brand veto never suppresses structure codes.

#### `/hig adapt`

1. Preflight; prefer existing DESIGN.md.
2. Same brand veto hard stop; structural reorders without spacing-token change allowed when clearly structure; else report/stop.
3. Bind grammar for surface archetype; smallest structural fixes; re-check via review.

#### Preflight internals (`load-context.mjs`)

- Stack: React/Next (or react-electron) from `package.json` deps → supported; else `mutation=unsupported` + stopLine.
- Register: DESIGN.md `register: product|brand`, else heuristic cues (landing/portfolio → brand; scoreboard/dashboard/admissionsdemo/`src/App.tsx` → product).
- Brand snapshot: scans candidate CSS files for `--bg|--fg|…` and `font-family`.
- Outputs both `mutation` (open|unsupported) and `reviewAdaptMutation` (open|blocked|unsupported).

#### Eval “proof” of FAILs (important: dry / structural, not visual)

`run-chrome-grammar.mjs` cases:

1. **grammar-load** — `loadChromeGrammar(skillRoot)` succeeds; `requiredIds` (4) present; `rules.length >= 4`.
2. **chrome-antipattern-coverage** — `expected.json` ⊆ grammar `byId`; manifest `violates` set equals expected; each manifest `file` exists under fixtures; packs contain `chrome.*` regex hits; SKILL includes `"Chrome grammar"`; review includes `"structure:chrome"`; design includes `"load-chrome-grammar"`.
3. **structure-mutation-class** — every rule `mutationClass === "structure"`; sidebar registers include `product` and exclude `brand`/`any`.

`run-dry.mjs` cases: sparse (stack pass, mutation open); unsupported (no package.json → stopLine); brand-veto (`register=brand`, `reviewAdaptMutation=blocked`).

**Both harnesses exit 0 when run (2026-07-25 verification).**

Surfaces under `eval/fixtures/chrome-antipatterns/surfaces/*.tsx` are human/agent examples of violations; the harness does **not** parse JSX to detect FAILs — it only checks file existence + ID coverage wiring.

---

### Files Read

- `hig-plugin/skills/hig/SKILL.md`
- `hig-plugin/skills/hig/references/verbs/design.md`, `review.md`, `adapt.md`, `teach.md` (header), `craft.md` (header)
- `hig-plugin/skills/hig/knowledge/chrome/grammar.yaml`, `review-rubric.md`, `README.md`
- `hig-plugin/skills/hig/knowledge/packs/patterns-lists-detail.md`, `patterns-forms.md`, `patterns-navigation.md`, `foundations-layout.md`, `foundations-materials.md` (partial)
- `hig-plugin/skills/hig/knowledge/registry.yaml` (partial, L1–80+)
- `hig-plugin/skills/hig/scripts/load-context.mjs`, `load-chrome-grammar.mjs`, `brand-snapshot-check.mjs`
- `hig-plugin/skills/hig/references/agents/gold-qa-reviewer.md`
- `hig-plugin/skills/hig/references/project/design-md-template.md`
- `hig-plugin/eval/run-chrome-grammar.mjs`, `run-dry.mjs`, `CHECKLIST.md`, `baseline.md`
- `hig-plugin/eval/fixtures/chrome-antipatterns/{README.md,manifest.yaml,expected.json,surfaces/*.tsx}`
- `hig-plugin/eval/fixtures/brand-veto/{DESIGN.md,package.json}`, `sparse/package.json`, `unsupported/README.md`
- `hig-plugin/.cursor-plugin/plugin.json`, `setup`, `README.md`, `docs/PROOF.md`, `CHANGELOG.md`

---

### Boundaries

| Lives in plugin | Lives in patient app |
|---|---|
| Skill router, verbs, packs, grammar SSOT, rubric | `DESIGN.md` brand + register + optional veto line |
| `load-context` / `load-chrome-grammar` / brand-snapshot scripts | `.hig/app-design.md`, `screens.yaml`, `progress.yaml`, evidence/ |
| Dry eval fixtures + harnesses | Actual React/CSS implementation of chrome |
| Shared laws (materials, list=browser, kit lock) as agent instructions | Project CSS tokens / components (kit lock: do not invent parallel system) |
| Install: `~/.cursor/skills/hig` symlink | Dogfood proof lives outside plugin (Pink Depot, admissionsdemo) — documented in `docs/PROOF.md`, not encoded as executable tests against those apps |

**Not in plugin eval:** live screenshot gold QA, patient-app mutation tests, CSS kit (`apple-hig-kit`), AST/DOM FAIL detectors against antipattern TSX.

**Materials policy:** encoded as SKILL shared law #3 + `foundations-materials.md` hybrid table; **no** `chrome.*` grammar FAIL ID for glass-on-nav.

---

### Non-Obvious Things

1. **Eval proves wiring, not detection.** Antipattern `.tsx` files are not analyzed for FAIL matches; `run-chrome-grammar.mjs` only checks ID presence, file existence, pack/skill string wiring, and `mutationClass`/`registers` invariants.

2. **`REQUIRED_CLASSES` omits `chrome.list-browser.filter-density`.** Loader requires 4 IDs (`load-chrome-grammar.mjs` L15–20); grammar + `expected.json` have 5. Filter-density is still in grammar and covered by antipattern fixture/manifest, but deleting it would not fail the “required” gate — only the expected/manifest set equality case.

3. **CHECKLIST says “four required chrome rule IDs”** (`eval/CHECKLIST.md` L31) while README/PROOF list five FAIL IDs including filter-density — consistent with REQUIRED_CLASSES vs full grammar.

4. **Brand register blocks review/adapt spacing mutation but not design mutation.** `mutation` stays `open` for brand fixtures (`run-dry` brand-veto preflight: `mutation=open review_adapt_mutation=blocked`); bare `/hig` can still write design + structure.

5. **Sidebar rule is product-only.** Rubric L25: on `register: brand`, skip `registers: [product]` rules. Eval asserts sidebar has no `any`/`brand` register (`run-chrome-grammar.mjs` L152–155).

6. **Soft pack prose vs hard IDs is an explicit product lesson.** README/PROOF: agents wrote “compact toolbar” and still shipped bad UI → grammar FAIL IDs extracted from Pink Depot dogfood.

7. **Teach/craft intentionally demoted.** SKILL L24: internal only; baseline.md records old menu-based verb maze.

8. **Brand-snapshot-check.mjs exists but is unused by `run-dry.mjs` / `run-chrome-grammar.mjs`.** Design verb mentions confirming brand snapshot keys; automated dry proof does not call it.

9. **Custom YAML parsers** in both `load-chrome-grammar.mjs` and `run-chrome-grammar.mjs` (minimal subset) — no yaml dependency.

10. **Version packaging:** plugin.json / CHANGELOG / README all `0.3.0` (2026-07-25); “early feedback / not finished.”

---

### Open Questions

1. Should `chrome.list-browser.filter-density` be added to `REQUIRED_CLASSES` so a grammar delete fails the required-rule gate (not only the expected.json sync)?
2. Will antipattern surfaces ever gain an automated matcher (regex/AST/agent) that asserts FAIL codes from source, or remain documentation-only forever?
3. Candidate grammar IDs in PROOF/README gaps — when encoded, do they stay `mutationClass: structure` with same report format?
   - Proposed names in `docs/PROOF.md`: `chrome.split.empty-select`, `chrome.split.list-width`, `chrome.create.short-vs-long`, `chrome.list-status.lifecycle`
4. Materials glass-on-nav: stay pack/law-only, or graduate to a `chrome.materials.*` FAIL ID?
5. Is `brand-snapshot-check.mjs` meant to be part of done evidence / dry eval, or optional agent hygiene only?
6. Plugin vs global install drift: workspace `hig-plugin` is the symlink target — any marketplace install of a different clone would diverge; is that intentional for this audit period?

---

### Deliberately *not* encoded yet (from README L87–92 + PROOF Gaps)

Documented soft / not hard FAIL IDs (seen on Pink Depot):

- Starved thin list rail beside empty detail whitespace → candidate `chrome.split.list-width`
- Nested Add → empty select loops / orphan half-width `/new` forms → candidates `chrome.split.empty-select`, `chrome.create.short-vs-long`
- Shared list status lifecycle (`loading` \| `empty` \| `ready` \| `fault`) as a grammar rule → candidate `chrome.list-status.lifecycle`
- CSS kit extraction (`apple-hig-kit`) — deferred until more gold passes

Also not machine-encoded as chrome FAILs (law/pack only): opaque-vs-glass materials, list-as-browser density prose beyond the three list-browser IDs, hit-target ≥44px (forms pack checklist / gold QA rubric).

---

### Packaging summary

| Piece | Fact |
|---|---|
| `.cursor-plugin/plugin.json` | `apple-hig` 0.3.0; skills path `./skills/` |
| `./setup` | Symlinks `skills/hig` → `~/.cursor/skills/hig`; refuses if dest exists and is not a symlink |
| Live install | Confirmed: `~/.cursor/skills/hig` → `…/Apple HIG/hig-plugin/skills/hig` |
| README gaps list | L87–92 + pointers to PROOF.md |
| Verify commands | `node eval/run-dry.mjs`; `node eval/run-chrome-grammar.mjs` (both pass) |
