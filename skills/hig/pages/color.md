---
slug: color
title: Color
group: Foundations
source: https://developer.apple.com/design/human-interface-guidelines/color
---

# Color

### color.001
Do not let one color mean two different things. Stay consistent, especially when color signals status or that something is interactive. If a brand color marks a borderless button as tappable, styling inert text with that color or a near match is confusing.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.002
Every app color should hold up when appearance is light, when it is dark, and when contrast is raised. Light settings and dark settings exist on iOS and on iPadOS, and likewise on macOS and tvOS. Hues supplied by the system shift slightly with appearance so lettering, symbols, and other pieces keep separation and contrast; turning Increase Contrast on makes those differences much stronger. Prefer those system hues, because variants for every context are already defined. A custom hue needs a light version, a dark version, and for each a higher-contrast alternative that separates tones much more. Even a single-appearance app should include light hues and dark hues so Liquid Glass can adapt.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.003
Test the palette under many kinds of light. On a sunny day outdoors, or in a dim room, colors change: bright surroundings make them look darker and more muted, while dark surroundings make them look bright and saturated. In visionOS, a wall or an object around the person, and how it reflects light, can change appearance too. Adjust until viewing is strong in the situations people actually encounter.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.004
Test across devices. True Tone, offered on some iPhone models, some iPad models, and some Mac models, reads room light and moves the display white point to match. Apps built around reading, photography, video, or play can push that shift harder or softer with a white-point adaptivity style. Try tvOS on several HD sets and on 4K TVs from more than one brand, using different picture settings. In System Settings > Displays on a Mac, preview P3 and also Standard RGB (sRGB).
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.005
Artwork and translucency change neighboring colors. When artwork varies, nearby colors may need to change so the interface stays continuous and elements neither overpower nor fade. Maps, for example, stays light in map mode and switches to a dark scheme in satellite mode. Color also shifts behind a translucent piece such as a toolbar, or when it is applied to one.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.006
When people choose colors, prefer the controls the system provides wherever they exist. Built-in pickers feel consistent, and people can save a palette they open from any app.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.007
Do not rely on hue alone to separate objects, to mark that something responds, or to carry information people must have. Repeat it another way so someone who cannot distinguish hues, or who has a different visual disability, can still understand. A text label or a glyph shape can identify an object or a state.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.008
Avoid colors that make content hard to perceive. Poor contrast lets icons and text melt into the background and become difficult to read, and some pairs are hard to distinguish for people who are color blind.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.009
Think about how other countries and cultures read your colors. Red can mean danger in one culture and something positive in another. The palette should send the message you intend.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.010
Do not hard-code values of system colors. Documented values are a design reference; actual values can move from release to release as conditions change. Apply system colors through the APIs.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.011
Do not assign dynamic system colors a meaning they do not have. Use them as intended so the experience stays consistent and still looks right when platform appearance changes. A color meant for one role should not be reused as text, or as a background.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.012
Tint Liquid Glass, and the symbols or text sitting on it, only sparingly. Save color for what truly needs emphasis, such as status or a primary action. Emphasize a primary action by coloring the background, not the symbol or the lettering. The system, for example, places the app accent color behind prominent buttons such as Done so they attract attention and look more prominent. Refrain from tinting the backgrounds of many controls.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.013
When the backdrop is full of color, keep control labels off similar hues. Hue can make an app appealing, playful, or true to a brand, yet too much overwhelms and makes those labels harder to read. With rich or colorful backdrops, prefer toolbars and tab bars that stay monochromatic, or an accent separated enough to see. Where content and backdrops are mostly without hue, choosing the company’s hue as accent for the app can tailor the experience and express identity.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.014
Notice where color sits in the content layer. Preserve contrast by keeping similar hues from overlapping between that layer and the controls. Colorful material may pass under controls while scrolling, but the resting state — such as the top of a scrollable screen — must stay clearly legible.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.015
Attach a color profile to each image so the result matches your intent from one screen to another. Most screens reproduce the sRGB space accurately.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.016
Where the display can show it, wide color enriches the picture. Compatible displays cover a P3 space that can look richer and more saturated than sRGB, so photography and video feel more lifelike and status or plotted data can mean more. When appropriate, author with Display P3 at a depth of 16 bits on every pixel channel and export PNG. Selecting P3 colors, and designing images that use wide color, requires a display capable of wide color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.017
Supply image and color variants for each color space when you need them. P3 usually looks fine on an sRGB display, but two very similar P3 colors can be hard to separate there, and a P3 gradient can look clipped. For fidelity on both wide color displays and sRGB displays, the Xcode asset catalog can store a version of each image and each color per space.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.018
Use primary for the view as a whole.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.019
Use secondary when grouping material inside the overall view.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.020
Use tertiary when grouping material inside secondary elements.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.021
Label colors a text label whose content is primary.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.022
Secondary label colors a text label whose content is secondary.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.023
Tertiary label colors a text label whose content is tertiary.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.024
Quaternary label colors a text label whose content is quaternary.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.025
Placeholder text colors the stand-in copy inside controls or text views.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.026
Separator marks a divider that still lets some material underneath show through.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.027
Opaque separator marks a divider that hides every bit of material underneath.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.028
Link colors copy that functions as a link.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.029
Alternate selected control text color is the lettering on a selected surface inside a list or a table.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.030
Alternating content background colors fill every other row, or every other column, inside lists, tables, and collection views.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.031
Control accent is the accent someone selects in System Settings.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.032
Control background color fills a broad surface, for instance the area of a browser or of a table.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.033
Control color is the face of a control.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.034
Control text color is the lettering of a control that can be used.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.035
Current control tint is the tint the system assigns to controls.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.036
Unavailable control text color is the lettering of a control that cannot be used.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.037
Find highlight color marks a find indicator.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.038
Grid color draws the gridlines of an element such as a table.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.039
Header text color is the lettering inside the cell that heads a table.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.040
Highlight color represents the virtual light on the screen.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.041
Keyboard focus indicator color is the ring around whichever control has keyboard focus during interface navigation.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.042
Label color is the lettering of a label that carries primary content.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.043
Link color marks a link that leads to other content.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.044
Placeholder text color is the stand-in string in a control or a text view.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.045
Quaternary label color is the faintest label lettering, including watermark copy, sitting below tertiary label text in importance.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.046
Secondary label color is lettering below the main label in importance, including a subheading or further detail.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.047
Selected content background color backs selected content inside a key window or a key view.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.048
Selected control color is the face of a control that is selected.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.049
Selected control text color is the lettering of a control that is selected.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.050
Selected menu item text color is the lettering of a menu that is selected.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.051
Selected text background color backs text that is selected.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.052
Selected text color is the hue applied to text that is selected.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.053
Separator color divides different sections of content.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.054
Shadow color is the virtual shadow cast by something raised on the screen.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.055
Tertiary label color is lettering less important than a secondary label.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.056
Text background color is the backing that sits behind text.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.057
Text color is the lettering inside a document.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.058
Under page background color is the backing behind what a document contains.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.059
Unemphasized selected content background color marks selected content when the window or view is not key.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.060
Unemphasized selected text background color backs selected text when the window or view is not key.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.061
Unemphasized selected text color is selected text when the window or view is not key.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.062
Window background color is the backing of a window.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.063
Window frame text color is the lettering in a window’s title bar area.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.064
On tvOS, a limited palette that coordinates with the logo can carry the brand while still deferring to the content.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.065
On tvOS, do not indicate focus with color alone. Subtle scaling and animation that responds are the main signs that a focused element is interactive.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.066
On visionOS, use color sparingly, and especially so on glass. Ordinary windows use the system-defined glass material, which lets through light and objects from the physical room and from the person’s space. Those colors can reduce how readable colorful app content is. Prefer color where it draws attention to something important or shows how parts of the interface relate.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.067
On visionOS, prefer color in type that is bold and in regions that are large. Colored type that is lightweight, or a colored area that is small, is harder to see and to understand.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.068
In a fully immersive visionOS experience, balance brightness so viewing stays comfortable. Strong contrast can steer attention, but it hurts once eyes have adapted to dim light or to darkness. Bring an object to full brightness only if the surrounding scene is bright too. Avoid, in particular, a bright object that flashes or moves against black or a very dark field.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.069
On watchOS, let background color support content already on screen or add information. It can establish place and help people recognize what matters. Activity, for example, gives each Move, Exercise, and Stand infographic a background that matches its ring. Communicate with that color; do not use it only as flourish. Skip a full-screen field of color on views likely to stay visible a long time, such as workout or audio playback.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.070
On watchOS, people may prefer a graphic complication rendered with a tint rather than with every hue. A single hue, taken from the wearer’s selection, can be applied by the system to images, gauges, and text in that complication.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.071
Red is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.072
Orange is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.073
Yellow is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.074
Green is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.075
Mint is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.076
Teal is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.077
Cyan is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.078
Blue is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.079
Indigo is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.080
Purple is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.081
Pink is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.082
Brown is one of the system colors.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.083
Gray is an iOS and iPadOS system gray color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.084
Gray (2) is an iOS and iPadOS system gray color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.085
Gray (3) is an iOS and iPadOS system gray color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.086
Gray (4) is an iOS and iPadOS system gray color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.087
Gray (5) is an iOS and iPadOS system gray color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.088
Gray (6) is an iOS and iPadOS system gray color.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.089
On December 16, 2025, Liquid Glass guidance was revised.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.090
On June 9, 2025, system color values were revised and Liquid Glass guidance was added.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.091
On February 2, 2024, UIKit gray colors were distinguished from SwiftUI gray colors on iOS and iPadOS, and advice was added for balancing brightness in visionOS apps.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.092
On September 12, 2023, watchOS advice for background color was expanded, and color swatches for tvOS were added.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.093
On June 21, 2023, the page gained guidance covering visionOS.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.094
On June 5, 2023, watchOS advice for background color was revised.
Source: https://developer.apple.com/design/human-interface-guidelines/color

### color.095
On December 19, 2022, RGB values were corrected for the system mint color in Dark Mode on iOS and iPadOS.
Source: https://developer.apple.com/design/human-interface-guidelines/color
