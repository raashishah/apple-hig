/** Anti-pattern: product home as a marketing card grid. */
export function Home() {
  return (
    <main data-home>
      <div className="card-grid">
        <article className="card">Orders</article>
        <article className="card">Inventory</article>
        <article className="card">Vendors</article>
        <article className="card">Analytics</article>
      </div>
    </main>
  );
}
