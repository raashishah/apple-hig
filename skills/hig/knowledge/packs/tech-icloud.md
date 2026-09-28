# tech-icloud

**Apple:** [iCloud](https://developer.apple.com/design/human-interface-guidelines/icloud)  
**Surface id (later):** `icloud`  
**Compose with:** packed file-management when the same chrome already exists; do not treat packed file-management, packed SharePlay, or a bare iCloud phrase as this pack  
**Gate (later):** `always` when the host has iCloud chrome (`CKContainer`, `NSUbiquitousKeyValueStore`, `data-icloud`); skip otherwise

iCloud keeps people's documents together without a per-file keep prompt, does not alert when they turned iCloud off, and does not store app resources in iCloud. Do not invent iCloud. Do not map this pack onto packed file-management.

## Apple guidance (1:1)

- Avoid asking which documents to keep in iCloud. Most people expect all of their content to be available in iCloud and don’t want to manage the storage of individual documents.
- Make sure your app behaves appropriately when iCloud is unavailable. If someone manually turns off iCloud or turns on Airplane Mode, you don’t need to display an alert notifying them iCloud is unavailable.
- Respect iCloud storage space. Use iCloud to store information people create and understand, and avoid using it for app resources or content you can regenerate.
- Custom top toolbars and explicit Save stay on packed file-management. This pack does not invent a document browser.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Asking which documents to keep in iCloud.
- Alert when iCloud is unavailable.
- App resources stored in iCloud.

## Apply in host

Map onto existing iCloud chrome (`CKContainer`, `NSUbiquitousKeyValueStore`, `data-icloud`). Do not invent iCloud, a keep-in-iCloud picker, or an unavailable alert. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing CloudKit / ubiquity chrome when it already exists, not a custom iCloud replica |
| UIKit | `CKContainer` / `NSUbiquitousKeyValueStore` when they already exist |
| AppKit | Existing iCloud document chrome when it already exists |
| Web | Existing `data-icloud`, not packed file-management or a generic iCloud label |

## Checklist

- [ ] A real iCloud widget exists before this pack applies
- [ ] The host does not ask which documents to keep in iCloud
- [ ] The host does not alert that iCloud is unavailable
- [ ] App resources are not stored in iCloud
- [ ] Packed file-management and packed SharePlay stay themselves
