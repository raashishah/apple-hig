# Why: chrome FAIL IDs in `grammar.yaml` (source-control / design-history)

**Question:** Why is Apple HIG chrome encoded as semantic FAIL IDs in `grammar.yaml` (not AST scanners, not per-screen YAML, not patient CSS class detection)? What must a v0.4 expansion honor?

**Skipped categories (justified):** Linear / Notion / Slack MCP — not needed for this local design decision. Infra / error / analytics — N/A (no production telemetry for skill encoding).

**Repo git note:** `hig-plugin` remote `raashishah/apple-hig` currently has **one** commit on `main` (`4da55ff`). Grammar history is not multi-commit in git; pre-release design evidence lives in `.audit/` and (ephemeral) `/tmp/arena-hig-chrome/`.

---

### What We Found (direct evidence)

#### Soft pack prose failed; hard IDs were the fix

- Parent workspace preference (still current): `/hig` must catch solved chrome via **hard FAIL gates**, not soft “compact toolbar” prose that still ships childish UI (`AGENTS.md`).
- Grounding audit (2026-07-24): packs already said “list = browser, compact toolbar” but had **no FAIL criteria** for the four Pink Depot-class structure bugs; dry eval had only preflight/brand-veto (`eval/run-dry.mjs`), no chrome anti-pattern fixture (`.audit/hig-chrome-grammar-grounding.md`).
- Shipped proof narrative: chrome kept failing as soft advice → forced hard FAIL IDs in `knowledge/chrome/grammar.yaml` (`docs/PROOF.md` §Pink Depot #2; `README.md` “Chrome grammar … soft prose is not enough”).
- Decision TSV: framed as “flows good chrome bad; packs too abstract”; architect picked **candidate-1 `grammar.yaml` SSOT** because it was the “smallest surface that still forces FAIL ids”; C2 AST and per-screen yaml rejected (`.audit/hig-chrome-grammar.tsv` rows 2026-07-24T14:32–14:41).

#### Arena explicitly rejected the three alternatives in the question

Arena cross-judge (`/tmp/arena-hig-chrome/judge.md`, 2026-07-24) scored C1 **12**, C2 **10**, C3 **9**. Recommended base: **Candidate 1**. Explicit rejects:

| Rejected approach | Where proposed | Judge / synthesis reject reason |
|---|---|---|
| AST / heuristic scanner (`chrome-review.mjs`, `tsx_ast`, patient patterns) | C2 `DESIGN.md` (`detect.kind: tsx_ast`, patterns like `ViewModeToggle`, `.we__list-toolbar`) | “patient-derived patterns … violate grounding (‘do not extract Pink Depot tokens’) and will false-negative in other repos” (`judge.md`); synthesis: “patient leakage, brittle” |
| Per-screen `.hig/chrome/*.yaml` | C2 design lifecycle | “fifth file family, duplicate truth with `screens.yaml`, … agents will skip” (`judge.md`); synthesis: “fifth artifact family for v1” |
| Compile step + project rubric snapshot | C3 `compile-chrome-rubric.mjs` + `.hig/chrome-rubric.json` | “extra hop and snapshot drift … for no DOM proof” (`judge.md`); synthesis: “extra hop; load grammar.yaml directly” |
| Opaque IDs (`CG-001`, `CG-VIEW-MODE-001`) | C2/C3 | Synthesis Rejected: “Opaque `CG-001` IDs (prefer semantic `chrome.view-mode.icons`)” |
| Patient CSS / component class detection as canon | C1 deliberate non-goals; C2 detect examples | C1: “Does not teach agents Pink Depot class names (`we__*`, `ListPaneChrome`) as canon”; C2 detect used `.we__list-toolbar` / `SidebarCollapse` — rejected with AST path |

C1’s load-bearing decision (arena): **“Chrome grammar is a separate machine-readable SSOT (`grammar.yaml`), not more pack prose. Packs cite rule IDs. Review/design verbs require those IDs in output. Eval owns proof.”** Alternatives lost: prose-only packs, mega `patterns-chrome.md`, static ESLint/AST as SSOT for v1, patient-derived gold kit (`/tmp/arena-hig-chrome/candidate-1/DESIGN.md` §§Shape / Alternatives).

#### What actually shipped (commit + files)

- **Commit:** `4da55ff0d85b309782f34607faaca21af6658471` — “Release Apple HIG Web v0.3 for public feedback.” (2026-07-25). Introduces `skills/hig/knowledge/chrome/grammar.yaml`, `eval/run-chrome-grammar.mjs`, chrome-antipattern fixtures, pack `## Chrome gates`, verbs/SKILL wiring. **No earlier git commits** in this repo for incremental grammar evolution (CHANGELOG claims 0.2.0 chrome grammar v1, but those steps are not separate commits on this remote history).
- **SSOT shape** (`grammar.yaml` header): “Packs cite rule ids only. Criteria live here. Apple URLs only — never patient app paths or brand tokens.” Rules use semantic ids: `chrome.view-mode.icons`, `chrome.list-browser.toolbar-budget`, `chrome.list-browser.filter-density`, `chrome.form.column-cohesion`, `chrome.sidebar.collapsible`; all `mutationClass: structure`.
- **Pack contract:** e.g. `patterns-lists-detail.md` `## Chrome gates` lists IDs only (no second copy of `failWhen`).
- **Eval is existence/wiring proof, not AST detection:** `run-chrome-grammar.mjs` comment: “Dry proof that chrome grammar gates exist… Does not mutate designed apps. Does not run an LLM.” It asserts required IDs present, fixture `expected.json` ↔ `manifest.yaml` ↔ grammar, packs cite `chrome.*`, SKILL/review/design wired — **not** that TSX AST matched.
- **Chrome README:** “Packs only cite rule IDs… Review must emit `structure:<id>`… Brand veto blocks spacing mutation, never structure FAIL reports.”
- **SKILL.md law:** “Soft pack prose is not a substitute.” Brand veto: structure chrome FAILs still report.

#### Named next candidates (gaps → likely v0.4)

From `docs/PROOF.md` Gaps and `README.md` Status — honest (not yet hard FAIL IDs):

| Candidate ID | Symptom |
|---|---|
| `chrome.split.empty-select` | Empty catalog still shows idle “Select a…” detail pane |
| `chrome.split.list-width` | List rail starved thin beside empty detail whitespace |
| `chrome.create.short-vs-long` | Long create stuck as orphan half-width form in split |
| `chrome.list-status.lifecycle` | Loading/fault panes still offer Add or dead detail |

Also deferred: reusable CSS kit extraction after more gold passes.

#### Graft vs reject nuance (filter-density)

- Judge initially listed rejecting C3’s separate P1 filter-density in v1 (`judge.md` “What to reject”).
- Synthesis + TSV **grafted** it: `chrome.list-browser.filter-density` landed as P1; fixture `expected.json` includes it.
- Inference: final product followed synthesis grafts over that one judge reject bullet.

#### Null / thin results (honest)

- **Git blame / multi-commit story:** null beyond `4da55ff` squash/release. Cannot attribute grammar lines to earlier authors via `git log --follow`.
- **`/tmp/arena-hig-chrome`:** present on this machine at investigation time; **not** in the git repo — treat as local design artifact, may disappear.
- **No Linear/Slack design threads consulted** (per skip justification).

---

### What We Can Reasonably Infer

1. **Why semantic FAIL IDs:** Soft prose was empirically insufficient on Pink Depot; agents needed stable, citable codes (`structure:chrome…`) that dry eval and review reports can assert. Semantic `chrome.*` names beat opaque `CG-00x` for agent readability and issue feedback (`PROOF.md` “expected FAIL ID (or a new ID name)”).
2. **Why not AST / patient class detection in v0.3:** Portability + grounding — skill must work across React apps without smuggling Warehouse/`we__*` selectors; AST heuristics were judged brittle and patient-leaky. Live matching stays LLM/gold-QA; dry eval only proves gates *exist and are wired*.
3. **Why not per-screen chrome YAML / compile rubric:** Surface tax without more regression safety for v1; keeps pack format ~40-line append-only `## Chrome gates` and a single hop `load grammar.yaml`.
4. **v0.4 expansion likely continues the same encoding** (new `chrome.*` rows + pack ID cites + fixture/expected updates), not a rewrite to AST SSOT — unless evidence shows dry-only gates still soft-pedaled in the field.

---

### What We Don't Know

- Whether arena judge grafts that **did not ship** (closed `class:` taxonomy field; deferred optional `detect` hints) are still intended for v0.4 or abandoned.
- Whether filter-density’s P1 vs folding into toolbar-budget remains settled, or will be revisited.
- Whether live gold-QA agents reliably emit `structure:<id>` in the wild (PROOF/README invite feedback; no public issue corpus cited here).
- Exact pre-`4da55ff` commit history of local plugin work before public packaging (not in this remote’s single-commit graph).
- Whether v0.4 will bump `grammar.yaml` `version: 1` or keep version and only add rules.

---

### Preserve / Change / Avoid / Risk constraints for v0.4

#### Preserve

- **`grammar.yaml` as FAIL SSOT**; packs cite IDs only under `## Chrome gates` (no second criteria store).
- **Semantic IDs** (`chrome.<area>.<rule>`), not opaque `CG-001`.
- **`mutationClass: structure`** for chrome rules; brand veto blocks spacing/touch **mutation**, never suppresses structure FAIL **emission**.
- **Apple HIG URLs only** in rule citations — never patient app paths or brand tokens (`Satoshi`, dusty rose, `we__*`).
- **Dry eval pattern:** fixture `manifest.yaml` + `expected.json` + `run-chrome-grammar.mjs` proving ID coverage/wiring (no LLM, no patient mutation).
- **Review contract:** `structure:<id>` citations; `/hig review` never auto-fixes.
- **Register scoping** (e.g. sidebar `registers: [product]` only) so marketing/brand landings are not forced into product shell chrome.
- **Named gap candidates** from PROOF/README as the default next ID set unless field feedback renames them.

#### Change (allowed / expected)

- **Add new `chrome.*` rules** for split empty-select, list-width, short-vs-long create, list-status lifecycle (and any feedback-driven IDs).
- Extend antipattern fixtures + `expected.json` + pack `## Chrome gates` lists + archetype → gates table in `review-rubric.md`.
- Optionally adopt deferred arena grafts: closed `class` field for coverage asserts; optional non-patient `detect` hints **outside** dry-eval critical path.
- Bump CHANGELOG toward 0.4; keep honest “gaps” list updated.

#### Avoid

- Making **AST / ESLint / patient CSS class scanners** the SSOT or a required install for `/hig`.
- Adding a **fifth artifact family** (`.hig/chrome/<screen>.yaml`) or a **required compile → `.hig/chrome-rubric.json`** hop without strong new evidence.
- Restating full `failWhen` criteria in pack prose or lengthening `SKILL.md` instead of grammar rows.
- Extracting Pink Depot / Warehouse component names or tokens into grammar/packs.
- Letting brand veto silence structure FAIL reports; mutating spacing/touch on locked brand surfaces “to fix chrome.”
- Opaque ID renames that break `structure:chrome…` report parsing and issue vocabulary.

#### Risk

- **False positives** on density judgments (toolbar-budget “>1 band”; list-width heuristics) across valid dense UIs — C1 already accepted this tradeoff.
- **Soft-pedal regression** if new rules stay PROOF prose only and never land as FAIL IDs + eval wiring.
- **Eval ≠ detection:** expanding IDs without improving gold-QA/agent matching still leaves live false negatives (C2’s scanner was rejected partly for the opposite failure mode).
- **ID proliferation / versioning:** new classes without a clear bump policy may confuse required-ID lists in `load-chrome-grammar.mjs` (`REQUIRED_CLASSES` currently hard-codes four of five shipped rules — filter-density is extra).
- **Arena tmp loss:** design rationale in `/tmp/arena-hig-chrome` is not versioned in `apple-hig`; this audit file + `.audit/hig-chrome-grammar-*.md` are the durable trail.

---

*Investigator posture: evidence before narrative. Primary sources: `.audit/hig-chrome-grammar-{grounding,synthesis}.md`, `.audit/hig-chrome-grammar.tsv`, `/tmp/arena-hig-chrome/{judge,candidate-*}/`, commit `4da55ff`, `grammar.yaml`, `eval/run-chrome-grammar.mjs`, `docs/PROOF.md`, `README.md`.*
