# patterns-notifications

**Apple:** [Managing notifications](https://developer.apple.com/design/human-interface-guidelines/managing-notifications)

**Glanceability (live-link only):** [Notifications](https://developer.apple.com/design/human-interface-guidelines/notifications) — lock screen / banner layout, grouping, and system presentation. Do not reprint that page or freeze notification UI pixels.

**Skip unless** the host sends push, local, or in-app permission prompts for notifications.

Encode **permission and timing**. Widgets / Live Activities are U5. Do not complete Sign in or Pay sheets.

## Apple guidance (1:1)

- Notifications are timely, high-value, and understandable at a glance (see live Notifications page for layout).
- Ask for permission **after** people have a reason to say yes — never as the first launch modal, never stacked with unrelated prompts.
- Explain *what* they will receive before the system dialog. The system alert is not the place for marketing.
- Use interruption levels honestly. Time-sensitive / critical are for genuine urgency, not growth.
- Let people manage types in-app **and** respect system Settings. Deep-link to system notification settings rather than re-implementing them.
- Group related notifications. Do not spam per-event if a digest will do.
- Quiet / provisional delivery when the value is low-stakes.
- In-app “foreground banners” follow the same: short, actionable, not a second inbox unless the product *is* messaging.

## Apply in host

| Host | Prefer |
|---|---|
| SwiftUI / UIKit | `UNUserNotificationCenter` request **at need**; provisional where allowed; in-app settings for categories |
| Web | Notification permission on a user gesture after value; never on page load. Honor `Notification.permission` |
| Mac | Same timing rules; menu-bar / system notification centre — do not draw a fake banner chrome |

## Do

- Tie the first ask to a concrete user action (“Notify me when this is ready”).
- Keep the payload glanceable; details open the app at the right object.

## Don't

- First-launch “Enable notifications” wall.
- Marketing as time-sensitive.
- Custom lock-screen UI that fights the system.
- A badge that conveys numeric information that isn't related to notifications.
- The app name in a notification button label.
- A notification action that merely opens your app.
- The app name or icon inside the notification content.
- Multiple notifications for the same thing.
- A custom component that mimics a notification badge.

## Checklist

- [ ] Permission after value
- [ ] Pre-prompt explanation
- [ ] Honest interruption level
- [ ] System Settings respected
- [ ] Glanceability left as live Notifications link
