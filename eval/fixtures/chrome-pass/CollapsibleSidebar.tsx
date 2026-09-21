/** Passing product sidebar: collapse control present. */
export function CollapsibleSidebar() {
  return (
    <aside
      data-sidebar
      style={{ width: "16rem", position: "fixed", left: 0, top: 0, bottom: 0 }}
      aria-label="Sidebar"
    >
      <button type="button" aria-expanded="true" aria-label="Collapse sidebar">
        Hide sidebar
      </button>
      <nav>
        <a href="/inventory">Inventory</a>
      </nav>
    </aside>
  );
}
