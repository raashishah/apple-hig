# tech-cluster-icloud-shareplay

**Gate:** `capability:icloud` / CloudKit / `capability:shareplay` / `capability:airplay` / `capability:homekit` — **not** `requiredIds`  
**Kind:** live-link cluster

## Live Apple pages

- [iCloud](https://developer.apple.com/design/human-interface-guidelines/icloud) (dedicated `icloud` surface attaches by appleUrl)
- [SharePlay](https://developer.apple.com/design/human-interface-guidelines/shareplay)
- [AirPlay](https://developer.apple.com/design/human-interface-guidelines/airplay)
- [HomeKit](https://developer.apple.com/design/human-interface-guidelines/homekit) (dedicated `homekit` surface attaches by appleUrl)

## Apply stance

System sign-in, Home, and playback pickers stay system. Apply host chrome around them. Do not complete iCloud or HomeKit pairing. Web-css **skip** unless the host actually uses these APIs.

## Don't

- Reimplement AirPlay / SharePlay / Home routing UI.
