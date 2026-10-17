---
slug: dark-mode
title: Dark Mode
group: Foundations
source: https://developer.apple.com/design/human-interface-guidelines/dark-mode
---

# Dark Mode

### dark-mode.001
Don’t offer an appearance setting that applies only to your app. A separate appearance option makes people adjust more than one control to get the appearance they want, and they may think your app is broken because it ignores their systemwide choice.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.002
Make the app look good in both appearances. Besides picking one mode, people can choose Auto, which switches between light and dark as conditions change through the day, possibly while the app is running.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.003
Check that content stays comfortably readable in each appearance. In Dark Mode, try Increase Contrast and Reduce Transparency both one at a time and combined; dark lettering on a dark ground can get harder to read, and Increase Contrast there can actually lessen the visual separation. Someone with strong eyesight may still manage low-contrast type, yet many people will not.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.004
In rare cases, use only a dark appearance. An app for immersive media, for example, can stay dark so the UI recedes and people can focus on the media.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.005
Choose colors that follow the active appearance. Semantic colors adapt by themselves on macOS and on iOS and iPadOS. A custom color belongs in a Color Set inside the Xcode asset catalog, with bright and dim variants, and hard-coded values or nonadapting colors should be avoided.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.006
Keep contrast strong in every appearance. System colors help foreground separate from background. Don’t let the ratio fall below 4.5:1, and for colors you define yourself aim at 7:1, particularly for small type, so the result meets recommended accessibility guidance.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.007
Soften white backgrounds in content images. A slight darkening keeps a white image background from glowing against the surrounding Dark Mode.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.008
Use SF Symbols wherever you can. With dynamic tint colors, or with vibrancy, symbols work in both appearances.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.009
When one drawing isn’t enough, make separate interface icons for light and for dark. A full moon may want a faint dark outline against a light ground and no outline on a dark ground; a drop of oil may want a thin border so the edge remains visible on a dark ground.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.010
Full-color artwork should succeed in both appearances. Keep a single asset when it works for light and for dark; when it works for only one, edit it or produce a light version and a dark version, then pack them in an asset catalog under one image name.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.011
Labels should use the label colors the system provides. The four levels — primary, secondary, tertiary, quaternary — shift between light and dark without extra work.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.012
Let system views render text fields and text views. They keep type looking right on every background and respond to vibrancy on their own, so prefer them to drawing the glyphs yourself.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.013
Use the background colors the system provides. Dark Mode moves the ground from base to elevated when UI comes forward — a popover or a modal sheet, for example — and that elevated tone also separates apps during multitasking and windows when several are open. A background you paint yourself can hide those distinctions.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.014
A little transparency in a custom component’s background can pick up the window’s color while desktop tinting is on, so the piece stays in harmony even after the desktop picture changes. Apply it only to a component that already shows a background or a bezel, and only while the component is neutral and uncolored; a colored state can shift as the window samples a new place on the desktop or the picture itself changes.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode

### dark-mode.015
On August 6, 2024, art was added that contrasts the light and dark appearances.
Source: https://developer.apple.com/design/human-interface-guidelines/dark-mode
