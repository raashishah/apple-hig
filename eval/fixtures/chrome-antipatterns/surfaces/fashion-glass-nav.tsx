/** Anti-pattern: decorative blur on nav chrome. */
export function FashionGlassNav() {
  return (
    <header
      data-fashion-glass
      style={{
        position: "sticky",
        top: 0,
        backdropFilter: "blur(20px) saturate(140%)",
        background: "rgba(255,255,255,0.55)",
      }}
    >
      <nav aria-label="Primary">
        <a href="/home">Home</a>
      </nav>
    </header>
  );
}
