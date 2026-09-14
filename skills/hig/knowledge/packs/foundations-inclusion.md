# foundations-inclusion

**Apple:** https://developer.apple.com/design/human-interface-guidelines/inclusion  
**Phase:** 1

Inclusive product language and imagery. Accessibility mechanics stay in `foundations-accessibility.md`. Writing tone stays in `foundations-writing.md`.

## Apple guidance (durable)

- Put people first: respectful communication, content everyone can understand.
- Do not assume gender, age, ability, culture, or family structure in copy, avatars, or illustrations.
- Examples, sample data, and empty-state art should not center one default person.
- Avoid idioms and references that only one locale or in-group will get when the UI is global.
- Representation in photos and characters should not be a single stereotype for a role (e.g. “the doctor”, “the parent”).

## Do

- Neutral, specific labels (“people using the app”, named roles when needed).
- Settings and profiles that do not force binary choices unless the domain requires it.
- Review sample content in fixtures the same way as shipping strings.

## Don't

- Clownish “diversity” stock that tokenizes.
- Ability or body jokes in empty states.
- Skin-tone or hair defaults that cannot be changed where a person is depicted as the user.

## Apply in host

| Host | How |
|---|---|
| SwiftUI / UIKit | Copy + asset catalogs; SF Symbols Human / people glyphs only when they do not imply a stereotype |
| Web / CSS | PRODUCT/DESIGN copy, alt text, and illustration. No new character kit |
| Games | Player representation and default avatars follow the same respect rules; HUD slang still has to be understandable |

## Craft checklist

- [ ] Sample names/data are not one-culture-only
- [ ] No gendered UI that is not required
- [ ] Imagery does not convey meaning that text already needs for access
