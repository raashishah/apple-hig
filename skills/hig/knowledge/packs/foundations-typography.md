# foundations-typography

**Apple:** https://developer.apple.com/design/human-interface-guidelines/typography  
**Phase:** 1

## Apple guidance (web-relevant)

- Clear hierarchy: large title / title / headline / body / callout / footnote / caption-scale thinking.
- Prefer a coherent scale with strong weight contrast over many near-identical sizes.
- Body length stays readable; avoid ultra-wide text columns for prose.
- Platform dynamic type is an iOS concept; on web, respect user zoom and avoid px-locked UI that breaks at 200% zoom.

## Web translation

- Define a type ramp in tokens (`--text-large-title`, `--text-title`, `--text-body`, …) using rem.
- **Font families come from DESIGN.md** (project brand). Do not force San Francisco; a web SF-like / system stack is OK when brand says so.
- Page/detail large titles live in detail chrome; list browser columns stay compact (callout/body), not marketing display.
- Minimum readable body size; avoid decorative tiny labels for critical data.
- If the project canon sets a root scale (e.g. 112.5%), DESIGN.md wins.

## Do

- One display/title style for page headers; denser type in list browsers.
- Weight + size together for hierarchy (≥ ~1.25 steps between major levels).
- Tabular nums for data columns when useful.

## Don't

- Marketing hero type inside dense inventory lists.
- All-caps long labels.
- Mixing 5+ unrelated font families.

## Interaction states

Typography rarely changes on press; selection/emphasis use weight or secondary color tokens, not a new font.

## Craft checklist

- [ ] Ramp exists as tokens
- [ ] Brand fonts applied
- [ ] List vs detail type roles differ
- [ ] Zoom/reflow does not clip primary labels
