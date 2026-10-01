/** Anti-pattern: list rail starved beside an empty detail pane. */
export function SplitListWidth() {
  return (
    <section data-split>
      <div data-list-pane style={{ width: "4rem" }}></div>
      <div data-empty-detail></div>
    </section>
  );
}
