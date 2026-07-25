# DESIGN.md

> Written by `/hig`. Brand + register source of truth. Structure lives in `.hig/app-design.md`.

## Register

- register: product | brand

## Product

- purpose:
- users_and_scene:
- primary_jobs: []

## Platform

- platform_primary: phone | ipad | desktop | multi
- platform_secondary: []

## Brand

- personality: []
- accent_and_palette:
- fonts:
- anti_references: []
- materials: opaque-chrome-glass-overlays

## Voice

- how_it_should_feel:
- what_it_must_not_feel_like:

## Chrome policy

- nav: opaque
- overlays: glass-optional-with-fallback
- list_columns: browser-density
- detail: owns-large-title

## Notes

- Agents must not overwrite Brand during implement unless this file explicitly changes tokens in the same `/hig` design step.
- On `register: brand`, keep the line below unless the user asked to restyle spacing:
- brand_mutation_veto: spacing_and_touch_targets_locked
