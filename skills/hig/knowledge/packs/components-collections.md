# components-collections

**Apple:** [Collections](https://developer.apple.com/design/human-interface-guidelines/collections)  
**Also:** [Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables)  
**Surface id (later):** `collections`  
**Compose with:** required `lists-split` when the same pane is leased; do not treat a list as a collection  
**Gate (later):** `always` when the host has a collection/grid of items; skip otherwise

A collection manages an ordered set of content in a visual row or grid, usually images. It is not a list, table, or card-grid home. Do not invent a collection. Do not map this pack onto `<ul>` / `<ol>` / `<table>` or `List`.

## Apple guidance (1:1)

- Collections are ideal for image-based content.
- Use the standard row or grid. Avoid a custom layout that confuses people or draws undue attention to itself.
- Prefer a scrollable list/table for text. Text is simpler to digest in a list than in a collection.
- Use adequate padding around images so focus/hover stays visible and items do not overlap.
- Default interactions: tap to select, touch-and-hold to edit, swipe to scroll. Extra gestures only when the app needs them.
- Animate insert/delete/reorder when that feedback helps.
- Dynamic layout changes must be easy to track. Do not change the layout while people are viewing it unless they asked.

## Don't

- Custom collection layouts that confuse people.
- A collection of text that should be a table.
- Collection items that overlap.

## Apply in host

Map onto an existing collection (`UICollectionView`, `LazyVGrid`, `data-collection`). Do not turn a list into a grid. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | `LazyVGrid` / `LazyHGrid` for visual items; `List` stays a list |
| UIKit | `UICollectionView` standard flow/compositional row or grid |
| AppKit | `NSCollectionView` |
| Web | An existing item grid with `data-collection`, not a `<ul>` inventory list |

## Checklist

- [ ] A real collection exists before this pack applies
- [ ] Layout is a standard row or grid
- [ ] Text-heavy sets stay lists
- [ ] Items do not overlap
- [ ] A list host is not treated as a collection
