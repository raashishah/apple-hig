/** Passing form: title, actions, and fields share one column. */
export function CohesiveForm() {
  return (
    <div data-form-page style={{ maxWidth: "28rem" }}>
      <header style={{ maxWidth: "28rem" }}>
        <h1>Add inventory item</h1>
        <button type="submit">Save</button>
        <button type="button">Cancel</button>
      </header>
      <div data-form-body style={{ maxWidth: "28rem" }}>
        <label>
          Display name
          <input name="displayName" />
        </label>
      </div>
    </div>
  );
}
