# DESIGN.md

## Register

- register: brand

## Brand

- personality: [editorial, quiet, portfolio]
- accent_and_palette: warm ink on paper
- fonts: custom display + body
- materials: opaque-chrome-glass-overlays

## Notes

- Agents must not overwrite Brand during implement.
- `/hig review` and `/hig adapt` must not auto-mutate spacing or touch-target CSS without an explicit veto line below.
- brand_mutation_veto: spacing_and_touch_targets_locked
