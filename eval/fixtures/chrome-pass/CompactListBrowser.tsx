/** Passing compact list-browser: one toolbar, icon view-mode, no phrase checkbox. */
export function CompactListBrowser() {
  return (
    <div data-list-pane>
      <header role="toolbar" aria-label="Inventory">
        <input type="search" aria-label="Search inventory" />
        <div role="radiogroup" aria-label="View">
          <button type="button" role="radio" aria-checked aria-label="List view">
            <svg width="16" height="16" aria-hidden="true" />
          </button>
          <button type="button" role="radio" aria-checked={false} aria-label="Grid view">
            <svg width="16" height="16" aria-hidden="true" />
          </button>
        </div>
        <button type="button" aria-label="Hide out of stock" aria-pressed={false}>
          <svg width="16" height="16" aria-hidden="true" />
        </button>
      </header>
      <ul>
        <li>Item A</li>
        <li>Item B</li>
      </ul>
    </div>
  );
}
