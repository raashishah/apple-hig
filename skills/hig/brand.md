# Brand and Apple

This section is generic. It names no product.

`DESIGN.md` wins on look: colour, corner radius, type, and surface style such as glass.

Apple wins on behaviour: tap targets, contrast, safe areas, motion, and Reduce Motion.

When a `DESIGN.md` line overrides look, log it on the component in the manifest:

```yaml
overrides:
  - component: list
    property: colour
    designMd: "Accent is the brand blue."
```

The `designMd` value is the line from that project's `DESIGN.md`. Logged overrides are not defects. Behaviour checks still fail when an Apple rule is broken.
