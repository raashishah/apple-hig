/** Anti-pattern: stacked list-browser chrome + full-phrase filter checkbox. */
export function ListBrowserStack() {
  return (
    <div data-list-pane>
      <header>
        <h1>Inventory</h1>
        <p>Browse materials</p>
      </header>
      <div data-chrome-band="search">
        <input placeholder="Search inventory" />
        <button type="button">Add item</button>
      </div>
      <div data-chrome-band="options">
        <div role="radiogroup">
          <button type="button">List</button>
          <button type="button">Grid</button>
        </div>
        <label>
          <input type="checkbox" />
          Hide out of stock
        </label>
        <button type="button">Filters</button>
      </div>
      <ul>
        <li>Item A</li>
        <li>Item B</li>
      </ul>
    </div>
  );
}
