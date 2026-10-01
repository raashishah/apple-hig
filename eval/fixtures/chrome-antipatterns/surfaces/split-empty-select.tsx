/** Anti-pattern: empty list still shows an idle Select detail. */
export function SplitEmptySelect() {
  return (
    <section data-split data-list-status="empty">
      <ul></ul>
      <aside data-detail>Select a vendor</aside>
    </section>
  );
}
