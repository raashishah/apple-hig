# patterns-drag-and-drop

**Apple:** [Drag and drop](https://developer.apple.com/design/human-interface-guidelines/drag-and-drop)

Own surface: drag sources, drop delegates, reorder. Do not exclusive-lease a list’s row chrome away from `lists-split` — apply on the drag/drop handlers / drop-zone files.

**Skip unless** the host moves, copies, or reorders via drag (including pointer drag on web).

## Apple guidance (1:1)

- Drag and drop moves or duplicates selected content from one location to another.
- Sources must look draggable only when they are. Destinations highlight **before** drop. Invalid targets refuse clearly.
- Show a lift / preview of what is being dragged. Spring-load folders and container controls that open on hover.
- Drag is never the **only** path: provide a button, menu, or keyboard equivalent (VoiceOver / full keyboard access).
- Move vs copy follows the platform (Mac Option-copy; iOS often copy across apps, move within). Do not surprise-delete the source.
- Cancel by dropping outside a valid target.
- iPhone supports drag; iPad and Mac are where multi-item and cross-app shine. Encode rules, not UIKit recogniser recipes.
- Live-link [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures) for the gesture itself (U6). This pack is the drop contract.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI | `draggable` / `dropDestination` / `onDrag` / `onDrop`; Transferable types |
| UIKit | `UIDragInteraction` / `UIDropInteraction`; collection view drag APIs |
| AppKit / Mac | `NSDragging*`; pointer-sized targets; not 44pt phone hit slop as the only affordance |
| Web | HTML DnD or pointer-based reorder with keyboard alternatives; `aria-grabbed` / live announcement. Skip if no reorder/move |

## Do

- Keep list selection and drop-indicator in the list file; keep this pack’s notes on the interaction.
- Support multi-select drag when multi-select exists.

## Don't

- Hidden drag with no alternative.
- Drop that navigates away without a preview.
- Fighting system multi-window / split-view drops on iPad.
- A drag image that is constantly and radically changing.

## Checklist

- [ ] Visible source + destination highlight
- [ ] Cancel path
- [ ] Non-drag alternative
- [ ] Move vs copy matches platform
