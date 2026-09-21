# patterns-file-management

**Apple:** [File management](https://developer.apple.com/design/human-interface-guidelines/file-management)  
**Also:** [Windows](https://developer.apple.com/design/human-interface-guidelines/windows)  
**Surface id (later):** `file-management`  
**Compose with:** required `lists-and-tables` when the same files appear as rows; do not treat `<input type="file">` or a filename list as this widget  
**Gate (later):** `always` when the host has a document browser or file-provider UI; skip otherwise

Some apps support documents and files that people expect to manage throughout the system. Do not invent a file browser. Do not map this pack onto a native file input or a list of names.

## Apple guidance (1:1)

- Use the default file browser unless there is an important reason to create a custom one.
- Avoid including a custom top toolbar. A file-provider extension loads in a modal that already has a toolbar; a second toolbar is confusing and steals space.
- Hide file extensions by default, but let people view them if they choose.
- Avoid making people take an explicit action to save their work. Autosave while they edit and when they close a file or switch away.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- A custom top toolbar on a file-browser modal.
- File extensions shown by default.
- An explicit action to save required to keep work.

## Apply in host

Map onto an existing document browser (`UIDocumentBrowserViewController`, `DocumentGroup`, `NSOpenPanel`, `data-file-browser`). Do not turn `<input type="file">` into this pack. Do not inject a kit. Do not invent a browser or autosave.

| Host | Prefer |
|---|---|
| SwiftUI | An existing `DocumentGroup` / document launcher, not a new browser kit |
| UIKit | An existing `UIDocumentBrowserViewController`, not a second toolbar |
| AppKit | System open/save panels, extensions hidden by default |
| Web | An existing `data-file-browser` / `data-document-browser`, not `<input type="file">` |

## Checklist

- [ ] A real document browser exists before this pack applies
- [ ] The modal does not add a second top toolbar
- [ ] Extensions stay hidden unless people ask
- [ ] Work autosaves; Save is not the only way to keep it
- [ ] A native file input is not treated as this widget
