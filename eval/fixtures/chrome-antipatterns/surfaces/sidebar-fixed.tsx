/** Anti-pattern: fixed-width product sidebar with no collapse control. */
export function SidebarFixed() {
  return (
    <aside
      data-sidebar
      style={{ width: "16rem", position: "fixed", left: 0, top: 0, bottom: 0 }}
      aria-label="Sidebar"
    >
      <nav>
        <a href="/inventory">Inventory</a>
        <a href="/purchase-orders">Purchase orders</a>
      </nav>
    </aside>
  );
}
