/** Anti-pattern: list wrapped in nested card panels. */
export function NestedCards() {
  return (
    <div className="card" data-nested-cards>
      <div className="card">
        <ul>
          <li>Row A</li>
          <li>Row B</li>
        </ul>
      </div>
    </div>
  );
}
