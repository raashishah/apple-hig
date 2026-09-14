# patterns-sheets

**Apple:** https://developer.apple.com/design/human-interface-guidelines/sheets  
**Also:** alerts, action sheets  
**Compose:** `components-action-sheets.md` in this same worker. Phone/iPad action-sheet guidance rides here — do not take a second exclusive lease on overlay files.

## Apple guidance (web-relevant)

- Modal surfaces for focused tasks; dismissible with a clear exit.
- Alerts for decisive moments, not routine messages.

## Web translation

- Sheets/modals/pickers may use glass **only** inside `@supports (backdrop-filter: …)` with solid fallback.
- Dimmed scrim; focus trapped; Esc / explicit close.
- Alerts: short title, one message, 1–2 actions; destructive styled distinctly.

## Do

- Keep underlying nav as system chrome; only the overlay is a separate material. Do not paint an opaque custom bar under the sheet.
- Reduced-motion: opacity only, no large slides if preferred.

## Don't

- Custom opaque fills on page chrome, or decorative glass on content cards.
- Nested modal stacks without a strong reason.

## Interaction states

Overlay: enter / idle / exit. Actions: default / pressed / disabled.

## Checklist

- [ ] Solid fallback for glass
- [ ] Dismiss path
- [ ] Focus management
- [ ] Alert copy is short

## Apply in host

SwiftUI `.sheet` / `.alert`. UIKit `UISheetPresentationController`. Web: dialog + scrim + Esc; glass only on the overlay with solid fallback.
