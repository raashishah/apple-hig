/** Anti-pattern: full-bleed form chrome wrapping capped field column. */
export function FormColumnMismatch() {
  return (
    <div data-form-page style={{ width: "100%" }}>
      <header style={{ width: "100%" }}>
        <h1>Add inventory item</h1>
        <button type="submit">Save</button>
        <button type="button">Cancel</button>
      </header>
      <div data-form-body style={{ maxWidth: "28rem" }}>
        <label>
          Display name
          <input name="displayName" />
        </label>
        <label>
          Vendor
          <input name="vendorName" />
        </label>
      </div>
    </div>
  );
}
