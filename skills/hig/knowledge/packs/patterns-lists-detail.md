# patterns-lists-detail

**Apple:** https://developer.apple.com/design/human-interface-guidelines/lists-and-tables  
**Also:** split views, sidebars

## Apple guidance (web-relevant)

- Lists are for scanning and selection; detail is for work.
- Selection is obvious; rows stay dense and readable.

## Web translation

- List column = **browser**: compact toolbar (search/filter), dense rows, no hero marketing chrome.
- Detail owns **large title**, primary actions, and body.
- @768: list must not use a large `min-width` that crushes detail.
- @375: list OR detail full width; selection pushes or stacks detail below/full screen.

## Do

- Hairline separators; selected row fill using brand tokens.
- Empty and loading states for both panes.

## Don't

- Card grids posing as the master list.
- Putting the only primary CTA only in the list toolbar when detail is the work surface.

## Interaction states

Row: default / hover / pressed / selected / disabled.

## Chrome gates

Load `knowledge/chrome/grammar.yaml`. Cite these IDs in review; implement to PASS:

- `chrome.view-mode.icons`
- `chrome.list-browser.toolbar-budget`
- `chrome.list-browser.filter-density`

## Checklist

- [ ] Browser-density list
- [ ] Detail owns title
- [ ] 768 split survives
- [ ] 375 single-column path
- [ ] Chrome gates above would PASS
