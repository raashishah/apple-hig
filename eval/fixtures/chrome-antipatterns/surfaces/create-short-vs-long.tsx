/** Anti-pattern: long create trapped in the split; short create left outside detail. */
export function CreateShortVsLong() {
  return (
    <>
      <section data-split>
        <div data-list-pane>
          <ul>
            <li>Vendor</li>
          </ul>
        </div>
        <form data-create="long" data-form-page>
          <header>
            <h1>New order</h1>
          </header>
          <div data-form-body>
            <label>
              Name
              <input name="name" />
            </label>
          </div>
        </form>
      </section>
      <section data-split>
        <div data-list-pane>
          <ul>
            <li>Vendor</li>
          </ul>
        </div>
      </section>
      <form data-create="short" data-form-page>
        <label>
          Name
          <input name="name" />
        </label>
      </form>
    </>
  );
}
