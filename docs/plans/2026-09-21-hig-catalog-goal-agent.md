---
title: HIG catalog goal agent - Plan
type: feat
date: 2026-09-21
artifact_contract: ce-unified-plan/v1
artifact_readiness: implementation-ready
product_contract_source: ce-plan-bootstrap
execution: code
jev: jev-1.13.0
---

# HIG catalog goal agent - Plan

Jev (`jev-1.13.0`) ranked every fork below at confidence 1.0 except `plan_doc_shape` (0.98) and `success_bar` (0.82). TypeSafe is not a `/hig` runtime.

## Goal

`/hig` applies Apple's Human Interface Guidelines as **design rules** to whatever UI the host already has. A Vue list, a Flutter list, and a SwiftUI list all get the same list rule. The typeface can be anything the brand chose.

Done when applicable catalog topics for this host are satisfied, or rounds run out. Not when 12 swarm surfaces have been leased.

## Decisions

| ID | Decision | Jev |
|---|---|---|
| KTD1 | Agent is a **goal loop**: ingest catalog → keep applicable topics → apply → check → repeat. (session-settled: user-directed — chosen over a 12-surface swarm and over an Apple widget kit) | `goal_loop_applicable_topics` |
| KTD2 | Source of truth is a **framework-free** `failWhen` / `passWhen` plus the Apple URL. SwiftUI/CSS/Flutter snippets are mappings. (session-settled: user-directed — chosen over API names as the rule) | `design_rule` |
| KTD3 | Fonts stay with the brand. Typography rules are hierarchy, ramp, list-vs-detail roles, readability. Stop treating SF Pro as success. (session-settled: user-directed — chosen over `force_sf_pro`) | `brand_any_face` |
| KTD4 | Ingest **every live HIG topic**. Apply only if the host has that pattern or platform. Skip watch complications on a web app. Do not skip Lists because the host is Vue. | `ingest_all_gate_apply`; lists-on-Vue noul 0.95; complications-on-web noul 0.19 |
| KTD5 | First ship: canonical catalog + goal loop. Keep `check-chrome.mjs` as P0 for solved IDs. Do not rewrite every pack first. | `catalog_plus_goal_loop` |
| KTD6 | Jev stays off the `/hig` apply path. Use it to classify topics at plugin-build time. (session-settled: user-directed) | prior session |

Honest bar (Jev score 0.89 / 2): primary product chrome follows HIG structure on typical UI hosts. Not pixel-Apple. Not backends. Not every watch face.

## Design rule (example)

Rule (any stack): a scan surface is a dense list of peers; one selected; detail owns the title; cards are not the scan surface.

Mapping (not the rule): SwiftUI `List`, web `<ul>` / `role="list"`, Flutter `ListView`, Vue list component.

## Sequence

1. U1. Catalog YAML: one record per live Apple topic (`id`, URL, design rule, `appliesWhen`, optional mapping examples). Eval: count matches Apple's index; every record has a framework-free `failWhen`.
2. U2. Goal loop in `skills/hig/SKILL.md` + `references/verbs/design.md`: applicable set is the goal; round 1 is no longer "12 requiredIds and stop".
3. U3. Drop `appleTypeDefault` as a font rewrite. Keep type hierarchy rules.
4. U4. Pattern gates (`has_list`, `has_form`, `has_overlay`, `platform:watch`) — not framework names.
5. U5. Fixtures in at least two stacks (web + SwiftUI or Flutter) for the same design FAIL.

Files: `skills/hig/knowledge/catalog.yaml` (new), `skills/hig/scripts/load-catalog.mjs`, `skills/hig/SKILL.md`, `skills/hig/references/verbs/design.md`, `skills/hig/scripts/load-context.mjs`, `eval/run-catalog.mjs`.

## Non-goals

- Injecting SF Pro, SF Symbols, or SwiftUI into a host that does not have them
- Authoring every watch/tv/vision page before the loop exists
- TypeSafe at `/hig` runtime
- Calling a backend "not HIG compliant" for lacking UI

## Verify

```bash
node eval/run-dry.mjs
node eval/run-chrome-grammar.mjs
node eval/run-swarm.mjs
node eval/run-check-chrome.mjs
node eval/run-catalog.mjs
```

`run-catalog.mjs` must prove: catalog size tracks Apple's live index; Vue/Flutter list fixtures are applicable; a web host does not require complications; no topic rule names a framework as the pass condition.
