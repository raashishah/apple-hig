/** Anti-pattern: loading, fault, and empty still offer Add or a dead detail. */
export function ListStatusLifecycle() {
  return (
    <>
      <section data-list-status="loading">
        <button type="button">Add</button>
        <p data-detail>Select a vendor</p>
      </section>
      <section data-list-status="fault">
        <button type="button">Add</button>
        <p data-detail>Select a vendor</p>
      </section>
      <section data-list-status="empty">
        <button type="button">Add</button>
        <p>No vendors yet</p>
      </section>
    </>
  );
}
