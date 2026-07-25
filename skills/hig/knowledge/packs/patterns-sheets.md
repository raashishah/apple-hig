# patterns-sheets

**Apple:** https://developer.apple.com/design/human-interface-guidelines/sheets  
**Also:** alerts, action sheets

## Apple guidance (web-relevant)

- Modal surfaces for focused tasks; dismissible with a clear exit.
- Alerts for decisive moments, not routine messages.

## Web translation

- Sheets/modals/pickers may use glass **only** inside `@supports (backdrop-filter: …)` with solid fallback.
- Dimmed scrim; focus trapped; Esc / explicit close.
- Alerts: short title, one message, 1–2 actions; destructive styled distinctly.

## Do

- Keep underlying nav opaque; only the overlay softens.
- Reduced-motion: opacity only, no large slides if preferred.

## Don't

- Glass on page chrome.
- Nested modal stacks without a strong reason.

## Interaction states

Overlay: enter / idle / exit. Actions: default / pressed / disabled.

## Checklist

- [ ] Solid fallback for glass
- [ ] Dismiss path
- [ ] Focus management
- [ ] Alert copy is short
