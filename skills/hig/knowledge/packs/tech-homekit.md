# tech-homekit

**Apple:** [HomeKit](https://developer.apple.com/design/human-interface-guidelines/homekit)  
**Surface id (later):** `homekit`  
**Compose with:** packed icloud-shareplay when the same chrome already exists; do not treat packed iCloud, a generic Home app word, or packed managing-accounts as this pack  
**Gate (later):** `always` when the host has HomeKit chrome (`HMHomeManager`, `HMAccessory`, `HMHome`, `data-homekit`); skip otherwise

HomeKit keeps Siri service names free of company names, writes the HomeKit database only with direction, does not duplicate Home app settings, and does not block camera images. Do not invent HomeKit. Do not pack require-account. Do not map this pack onto packed iCloud.

## Apple guidance (1:1)

- Suggest service names that suit your accessory. Never suggest company names or model numbers for use as service names.
- Ask permission to update the HomeKit database when people make changes in your app. Never overwrite HomeKit database settings without a person's explicit direction.
- Don't present duplicate home settings. Always defer to the settings people made in the Home app.
- Don't block camera images. Avoid covering portions of the camera's images with other content.
- Don't require people to create an account stays on packed managing-accounts. This pack does not invent HomeKit pairing.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Company names or model numbers as Siri service names.
- HomeKit database overwritten without direction.
- Duplicate home settings.
- Camera images blocked.

## Apply in host

Map onto existing HomeKit chrome (`HMHomeManager`, `HMAccessory`, `HMHome`, `data-homekit`). Do not invent HomeKit, a pairing sheet, or a replica Home app. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing HomeKit manager chrome when it already exists, not a custom Home replica |
| UIKit | `HMHomeManager` / `HMAccessory` when they already exist |
| AppKit | `HMHomeManager` when it already exists |
| Web | Existing `data-homekit`, not packed iCloud or a generic Home label |

## Checklist

- [ ] A real HomeKit widget exists before this pack applies
- [ ] Siri service names are not company names or model numbers
- [ ] The HomeKit database is not overwritten without direction
- [ ] Home settings are not duplicated
- [ ] Camera images are not blocked
- [ ] Packed iCloud and packed managing-accounts stay themselves
