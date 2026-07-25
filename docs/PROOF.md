# Proof notes (v0.3)

What `/hig` actually changed on real apps — and what is still missing.

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

4. **Split / list consistency (recent)** — empty catalogs must not show dead “Select a…” detail; short creates stay in detail; long creates go full-page centered; shared list status lifecycle. These are **learned product rules**; not all are grammar FAIL IDs yet (see Gaps).

### What stayed brand-owned

Accent rose, Satoshi, cream surface, marketing landing register — **not** rewritten by chrome grammar. Brand veto blocks spacing/touch auto-mutation on locked brand surfaces.

## admissionsdemo (portable proof)

Bare `/hig` on a different React app:

- Wrote real `DESIGN.md` + `.hig/app-design.md` + `.hig/screens.yaml`
- Implemented structure/chrome on primary screens
- Left that app’s own tokens/fonts alone

Used to prove the skill is not “copy Pink Depot CSS.”

## Gaps (feedback welcome)

Propose these as next `chrome.*` FAIL IDs if you hit them:

| Candidate | Symptom |
|---|---|
| `chrome.split.empty-select` | Empty catalog still shows idle “Select a…” detail pane |
| `chrome.split.list-width` | List rail starved thin beside empty detail whitespace |
| `chrome.create.short-vs-long` | Long create stuck as orphan half-width form in split |
| `chrome.list-status.lifecycle` | Loading/fault panes still offer Add or dead detail |

Also deferred: reusable CSS kit extraction after more gold passes.

## How to send feedback

Open a GitHub issue with viewport + screenshot + expected FAIL ID (or a new ID name). Soft “looks off” without a screen is hard to act on.
