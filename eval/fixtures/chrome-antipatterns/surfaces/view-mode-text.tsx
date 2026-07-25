/** Anti-pattern: text List/Grid as primary glyphs. */
export function ViewModeText() {
  return (
    <div role="radiogroup" aria-label="Inventory view">
      <button type="button" role="radio" aria-checked>
        List
      </button>
      <button type="button" role="radio" aria-checked={false}>
        Grid
      </button>
    </div>
  );
}
