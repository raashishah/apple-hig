# components-web-views

**Apple:** [Web views](https://developer.apple.com/design/human-interface-guidelines/web-views)  
**Also:** [Layout](https://developer.apple.com/design/human-interface-guidelines/layout)  
**Surface id (later):** `web-views`  
**Compose with:** required `layout` when the same pane is leased; do not treat the host document as a web view  
**Gate (later):** `always` when the host has an embedded web view; skip otherwise

A web view loads and displays rich web content, such as embedded HTML and websites, directly within your app. Do not invent a web view. Do not map this pack onto the host page itself.

## Apple guidance (1:1)

- Support forward and back navigation when people are likely to visit multiple pages. Web views support that behavior, but it is not on by default. Provide corresponding controls.
- Avoid using a web view to build a web browser. Brief in-app access to a site is fine. Safari is the primary way people browse the web. Replicating Safari in your app is unnecessary and discouraged.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A multi-page web view without forward and back controls.
- A web view that replicates Safari.

## Apply in host

Map onto an existing embedded web view (`WKWebView`, `WebView(`, `iframe`, `data-web-view`). Do not turn the host document into this pack. Do not inject a kit. Do not invent Back or Forward.

| Host | Prefer |
|---|---|
| SwiftUI | An existing `WebView` / `WKWebView` pane, not a new in-app Safari |
| UIKit | An existing `WKWebView` with back/forward when multi-page, not a custom browser chrome |
| AppKit | An existing `WKWebView`, not a replica of Safari |
| Web | An existing `iframe` / `data-web-view`, not the host document |

## Checklist

- [ ] A real embedded web view exists before this pack applies
- [ ] Multi-page embeds expose forward and back
- [ ] Safari chrome stays out
- [ ] The host document is not treated as this widget
