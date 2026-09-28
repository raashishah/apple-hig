# tech-photo-editing

**Apple:** [Photo editing](https://developer.apple.com/design/human-interface-guidelines/photo-editing)  
**Gate:** `capability:photos` on surface `photo-editing`. Unknown hosts skip. Skip-unless affordance `photoedit` (`data-photo-edit`, `PHContentEditingController`). `import Photos` and `import PhotosUI` are the capability, not the widget. An `<img>` is not an editing session. A second toolbar in the editing session is the violation. A file-browser toolbar stays on file-management. Do not invent a confirm dialog. Do not remove the system toolbar.

Cancel keeps edits until people confirm, once they have made some.

## Do

- Ask people to confirm Cancel when edits exist, and say that those edits will be lost.
- Skip that confirm when no edits have been made yet.

## Don't

- Cancel that discards edits without a confirm.
- A custom top toolbar in a photo-editing session.
