# Proof notes (v0.4.1)

What `/hig` actually changed on real apps — and what is still missing.

## v0.4.1 harness (shipped)

**In scope for this release:** mechanical **chrome** (thirteen FAIL IDs, `check-chrome.mjs`, `apply-chrome.mjs`, recipes, dual-stack fixtures) plus **catalog infrastructure** (live `catalog.yaml`, `plan-catalog.mjs`, `apply-catalog.mjs`, `dont-heuristics.yaml`, `eval/run-catalog.mjs`). Round-1 apply SSOT stays the **12** `requiredIds` in `surfaces.yaml`; the catalog loop runs after chrome P0 and drives `.hig/catalog-status.yaml`.

**Not claimed:** every Apple HIG Don't is auto-fixed. A topic is **accounted** only when every Don't on it has a mechanical scanner (or the pack has no Don't section and chrome is clean). Everything else stays **`pending`** in status — that is expected, not a failed ship.

### Catalog Don'ts — known gaps

| Gap | What it means |
| --- | --- |
| **Design principles** | Both Don'ts have scanners (`dp-platform`, `dp-taste`). A clean host accounts the topic. A claim that this pack covers Watch, TV, or Vision, or house taste (`768/375-only gold` QA), stays pending. Watch, TV, and Vision are still not apply surfaces. |
| **No scanner yet** | Any Don't bullet without a matching rule in `knowledge/chrome/dont-heuristics.yaml` stays pending. CHANGELOG lists what *is* covered; new Apple pages need new scanners, not prompt luck. |
| **Skip-unless affordance** | Menus, pickers, NFC, AR, workouts, etc. skip when the host has no matching widget/capability (`skipped-no-affordance`). |
| **Human-only / invent UI** | StoreKit sheets, Sign in with Apple consent, Face ID, guest paths, nested `<dialog>` stacks, Unicode `←` back chevrons, and similar eval cases stay **pending** without inventing routes, copy, or native APIs. |
| **Tech & commerce packs** | Wallet, Tap to Pay, Maps legal link, HomeKit Siri names, Live Photos playback, SharePlay inflection, etc.: markers and safe strips apply; many live violations remain pending by design. |
| **Unpackaged / live-link** | Mac menu bar, some tab-view chrome, Watch/TV/Vision on web hosts, and live-link clusters (commerce, carplay-maps, icloud-shareplay) are inventory/stubs — not mechanical apply targets yet. |
| **Visual “Apple-ness”** | Passing eval does not prove gold QA on every arbitrary host; Pink Depot + admissionsdemo remain the patient proofs. |

Re-run proof on the branch: `node eval/run-dry.mjs`, `run-chrome-grammar.mjs`, `run-swarm.mjs`, `run-check-chrome.mjs`, `run-catalog.mjs` (see `eval/CHECKLIST.md`).

## Pink Depot (primary dogfood)

**What:** iPad-first inventory + order costing web app (React/Next).  
**Role:** Product-register patient. Brand (dusty rose, Satoshi, cream) must survive every pass.

### How `/hig` helped

1. **Gold QA gate** — Live screenshots @768 and @375 (not source-only review). 2026-07-09 re-run **PASS** after P0/P1 fixes:
   - Fixed phone bottom nav
   - Inventory split detail usable @768
   - Home WhatsApp hit target / accent

2. **Chrome that kept failing as soft advice** — agents wrote “compact toolbar” and still shipped childish UI. That forced **hard FAIL IDs** in `knowledge/chrome/grammar.yaml`:
   - Icon List/Grid (`chrome.view-mode.icons`)
   - One toolbar band (`chrome.list-browser.toolbar-budget`)
   - Compact filters (`chrome.list-browser.filter-density`)
   - Form column cohesion (`chrome.form.column-cohesion`)
   - Collapsible sidebar (`chrome.sidebar.collapsible`)

3. **Materials arbitration** — opaque nav/content; glass only on sheets/alerts/pickers with `@supports` fallback. Locked via project rule so later agents stop re-adding glass.

4. **Split / list flow** — empty lists omit the idle Select detail (`chrome.split.empty-select`); the list rail keeps its column when detail is empty (`chrome.split.list-width`); long create is a full page and short create stays in detail (`chrome.create.short-vs-long`); `loading` and `fault` do not offer Add or a dead detail (`chrome.list-status.lifecycle`). Status is the `empty | loading | ready | fault` union.

### What stayed brand-owned

Accent rose, Satoshi, cream surface, marketing landing register — **not** rewritten by chrome grammar. Brand veto blocks spacing/touch auto-mutation on locked brand surfaces.

## admissionsdemo (portable proof)

Bare `/hig` on a different React app:

- Wrote real `DESIGN.md` + `.hig/app-design.md` + `.hig/screens.yaml`
- Implemented structure/chrome on primary screens
- Left that app’s own tokens/fonts alone

Used to prove the skill is not “copy Pink Depot CSS.”

## Gaps (feedback welcome)

The four split/list flow IDs are encoded: `chrome.split.empty-select`, `chrome.split.list-width`, `chrome.create.short-vs-long`, `chrome.list-status.lifecycle`. Grammar, recipes, and `apply-chrome.mjs` own them. Dual-stack fixtures fail the antipattern and pass the clean host. `/hig flow` may create list, form, overlay, and chrome from `.hig/screens.yaml`. Catalog apply still does not invent a missing widget.

Also deferred: reusable CSS kit extraction after more gold passes.

## How to send feedback

Open a GitHub issue with viewport + screenshot + expected FAIL ID (or a new ID name). Soft “looks off” without a screen is hard to act on.
