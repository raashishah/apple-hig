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

Mechanical chrome gate + recipes. Host fonts stay (no SF Pro / `-apple-system` rewrite as success). Framework-agnostic design rules map onto the host stack. Any-model round 1 remains the 12 `requiredIds`. U1 catalog inventory (`knowledge/catalog.yaml`) is additive and is not the apply SSOT. U2 goal loop (`scripts/plan-catalog.mjs`) runs after chrome P0: remaining packed applicable topics, persist `.hig/catalog-status.yaml`, stop when remaining is 0. Visual any-host Apple-ness is still unproven.

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
4. U4. `appliesWhen` from host patterns (scan list, form, overlay, platform), not a framework enum.
5. U5. Same design FAIL proven on two detected stacks without naming those stacks in the rule.

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

`run-swarm.mjs` still requires `requiredIds.length === 12` and Duo off that list. Dry eval: no `appleTypeDefault` / `type_default=apple`. `run-catalog.mjs`: live-index diff with no expected integer; list host applicable for Lists; web host not applicable for complications; fail if a topic `passWhen` names a framework or a font family; wave 0 then catalog; remaining 0 is done; brand app-shell rows `n/a-register`; contract does not stop at twelve.
