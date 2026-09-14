# patterns-search

**Apple:** [Searching](https://developer.apple.com/design/human-interface-guidelines/searching), [Search fields](https://developer.apple.com/design/human-interface-guidelines/search-fields)

Composed: searching pattern + search field chrome. One surface. Do not also exclusive-lease the same host path as `forms`.

**Skip unless** the host already has search (search field, `.searchable`, `type="search"`, command-palette / filter-as-you-type). Silence is correct when there is no search.

## Apple guidance (1:1)

- Search is a way to find content in the app, on device, or in a document — not a second home screen.
- Results update as people type when the corpus allows; otherwise search on explicit commit (Return).
- Scope to the current context first. Offer refinement (scope bar, tokens, recent/suggested queries) instead of dumping the whole library.
- The field is a **search field**: magnifying-glass affordance, clear control, placeholder that names what can be found (`Search` or `Search Mail`). A generic text field is not search.
- Cancel / dismiss is obvious while the field is active. Esc cancels on pointer keyboards.
- Empty and no-result states explain what to try next. Do not leave a blank list.
- Live-link [Token fields](https://developer.apple.com/design/human-interface-guidelines/token-fields) for tokenised filters. Do not freeze Spotlight ranking or SF Symbol names.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `.searchable`, `NavigationStack` search, system search field in the toolbar — not a custom rounded rectangle |
| UIKit | `UISearchController` / `UISearchBar` in the navigation item |
| AppKit / Mac | `NSSearchField`; Search in the menu bar; filter in the toolbar. Pointer hit targets, not 44pt phone padding on a document window |
| Web | `input type="search"` or combobox with accessible name; results list `role="listbox"`; Esc clears/closes. Skip this pack’s worker if no search UI exists |

## Do

- Keep search in the toolbar / list header of the collection it filters.
- Show a clear button once there is query text.
- Preserve the previous query when the person cancels if the platform does.

## Don't

- Hide the only path to content behind search.
- Block the UI with a spinner on every keystroke; debounce and keep prior results visible.
- Use search as the settings or command dump.

## Checklist

- [ ] Host actually has search (otherwise skip)
- [ ] System search field, not a restyled text field without search semantics
- [ ] Cancel / clear / Esc
- [ ] Scoped results + empty state
- [ ] No file-lease fight with `forms` on the same path
