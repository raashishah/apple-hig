# tech-healthkit

**Apple:** https://developer.apple.com/design/human-interface-guidelines/healthkit  
**Gate:** `capability:healthkit` (HealthKit entitlement / `HealthKit` import / usage plist — **not** `requiredIds`)  
**Compose with:** foundations-privacy (when packed)

Permission copy and data-use chrome. Do not reprint Health data-type catalogs. Watch Health UI is out of this wave.

## Human-only

Never complete Health access sheets, biometrics, or Medical ID. Style chrome **around** the system permission UI. Do not ask the host user to grant Health on the agent’s behalf.

## Apple guidance (invariants)

- HealthKit is the central repository for health and fitness data on iOS, iPadOS, and watchOS.
- Ask for **only the types you use**, **when you need them** — not a launch-time grab of every quantity.
- Purpose strings (`NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`, and per-type copy where required) say **why** in plain language. Do not hide the reason in marketing fluff.
- Do not reinvent the Health app as a second dashboard of every sample.
- Health data is sensitive: no Health values in widgets, screenshots, logs, or shared images without an explicit product reason and permission.
- Read vs write are different grants. Do not imply write access when you only read.

## Do

- Trigger the system authorization UI from a contextual moment (first glucose chart, first workout save).
- After denial, the host still works; settings deep-link is optional, never a blocking alert loop.
- Label charts and units the person already uses in Health where you display samples.

## Don't

- Fire this pack on web-css or brand-veto fixtures.
- Pack CareKit / ResearchKit UI here — those are live-link clusters.
- Complete the Health permission sheet as an apply step.

## Apply in host

| Host | How |
|---|---|
| SwiftUI | `HealthKit` / `HKHealthStore` authorization; system sheet unmodified |
| UIKit | Same store APIs; purpose strings in Info.plist |
| Web / CSS | **Skip** — no HealthKit |
