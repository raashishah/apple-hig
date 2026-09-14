/** Anti-pattern: custom opaque fill on navigation chrome. */
export function OpaqueBarFill() {
  return (
    <header
      data-nav
      style={{
        position: "sticky",
        top: 0,
        background: "#1c1c1e",
        color: "#f5f5f7",
      }}
    >
      <nav aria-label="Primary">
        <a href="/home">Home</a>
        <a href="/search">Search</a>
      </nav>
    </header>
  );
}
