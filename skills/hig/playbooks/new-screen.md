# New screen

1. Read `principles.md` and `brand.md`.
2. Read only the topic pages the screen uses, from `pages/`. Do not invent guidance those files do not contain.
3. Build the screen with native controls. On the web, set the font to `-apple-system, system-ui, sans-serif`. Do not add an `@font-face` for SF.
4. Import `tokens/web.css` or `tokens/ios.swift`. Leave a property empty when Fig has not supplied the value.
5. Write the component manifest. Log each look override with the `DESIGN.md` line it comes from.

## Check

Run `node skills/hig/scripts/score-practice.mjs`. Done only when it exits 0.
