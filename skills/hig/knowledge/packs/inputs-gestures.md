# inputs-gestures

**Apple:** [Gestures](https://developer.apple.com/design/human-interface-guidelines/gestures)  
**Also:** [Apple Pencil and Scribble](https://developer.apple.com/design/human-interface-guidelines/apple-pencil-and-scribble), [Pointing devices](https://developer.apple.com/design/human-interface-guidelines/pointing-devices), [Game controls](https://developer.apple.com/design/human-interface-guidelines/game-controls)  
**Canonical slug:** `/gestures` (legacy `/touchscreen-gestures` 301s here — do not cite the old path)  
**Intended gate (not wired this PR):** touch / phone / iPad / UIKit / SwiftUI / mobile web. Skip on `platform_primary: desktop` unless the host is also a touch web app.

Do not add Digital Crown, Eyes, or remotes packs. Those hardware pages are later.

## Apple guidance (1:1)

- Give people more than one way to act. Do not assume a specific gesture is available (voice, keyboard, Switch Control).
- Standard gestures keep standard meanings: tap activates or selects; swipe reveals, dismisses, or scrolls; drag moves; pinch-hold reveals more; double-tap zooms; pinch zooms; rotate rotates.
- Custom gestures only for frequent specialised tasks (drawing, games). They must be discoverable, easy, distinct, and never the only path to an important action.
- Shortcut gestures (edge swipe Back) supplement chrome — keep the Back control.
- Do not steal system edge gestures (Home indicator, Control Center, app switcher).
- Respond immediately and 1:1; show why a gesture failed (locked object, disabled control).
- iPhone/iPad extras people already know: three-finger swipe undo/redo, three-finger pinch copy/paste, shake undo, four-finger swipe app switch (iPad). Do not override them for app-unique actions.
- Simultaneous recognition is for games (stick + fire), not typical productivity chrome.

## Apply in host

Encode rules, not gesture-recognizer cookbooks. Prefer system gestures over custom `UIPanGestureRecognizer` stacks.

| Host | Prefer |
|---|---|
| SwiftUI | system `onTapGesture` / `DragGesture` / `MagnifyGesture` on content; swipe-to-pop and sheet dismiss; `.simultaneousGesture` only when two controls must work together |
| UIKit | `UIKit` navigation/interactive pop, `UIScrollView` pan, table swipe actions; do not install competing edge pans |
| Web | tap/click on the same control; swipe-to-dismiss only on grab-able sheets; 44px phone targets; do not hijack browser back-swipe or overscroll |

## Do

- Keep a visible control for every important action a gesture also performs.
- Make disabled/locked state obvious when a gesture no-ops.
- Track the finger while dragging overlays (interruptible).

## Don't

- Unique meaning for tap or swipe (e.g. tap-to-delete with no button).
- Custom edge swipes that fight system Home / back.
- Gesture-only navigation with no toolbar Back.

## Checklist

- [ ] Standard gestures keep standard meanings
- [ ] Custom gestures are optional shortcuts
- [ ] System edge gestures still work
- [ ] Failure/disabled feedback exists
- [ ] Phone/iPad fixture would load this pack; desktop-admin would not
