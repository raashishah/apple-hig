---
slug: typography
title: Typography
group: Foundations
source: https://developer.apple.com/design/human-interface-guidelines/typography
---

# Typography

### typography.001
Pick sizes most people can read easily across viewing distances and conditions, follow each platform’s recommended default and minimum for both custom fonts and system fonts, and remember weight affects ease of reading — a thin custom face should run larger than those recommendations.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.002
On iOS and iPadOS, the default text size is 17 pt and the smallest recommended size is 11 pt.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.003
On macOS, the default text size is 13 pt and the smallest recommended size is 10 pt.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.004
On tvOS, the default text size is 29 pt and the smallest recommended size is 23 pt.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.005
On visionOS, the default text size is 17 pt and the smallest recommended size is 12 pt.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.006
On watchOS, the default text size is 16 pt and the smallest recommended size is 12 pt.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.007
Check readability in each context, including game text on every platform the game runs, and if some text is hard to read, try a larger size, stronger contrast by changing the text color or the background, or faces built for legibility such as the system fonts.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.008
Generally skip light weights. System faces read more clearly in Regular, Medium, Semibold, or Bold; Ultralight, Thin, and Light are hard to see, especially at small sizes.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.009
Vary weight, size, and color to stress what matters and to make hierarchy visible, and keep that relative ranking and the visual separation of text elements when people change text size.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.010
Use few typefaces, even in a highly customized interface, because mixing many of them can hide hierarchy, hurt readability, and make the UI feel inconsistent or poorly designed.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.011
When text size changes, enlarge what matters most: a bigger size usually means people want the content they care about to be easier to read, not every word on screen, so tab titles in a tabbed window need not grow, and in a game spoken dialog matters more than fleeting hit-damage numbers.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.012
The system sans serif family is San Francisco (SF). It includes SF Mono and SF Hebrew, then SF Georgian with SF Armenian, plus SF Arabic, SF Compact, and SF Pro.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.013
New York (NY) pairs a serif design with the ability to work alone or next to SF.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.014
Prefer the built-in text styles, which convey hierarchy through size and weight in a consistent way, and paired with the system fonts they also support Dynamic Type plus larger accessibility sizes where those exist, so people can pick a size that works for them.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.015
Adjust built-in text styles through symbolic traits, the font adjustments system APIs define: the bold trait adds weight for another hierarchy level, and leading can loosen or tighten — extra line spacing helps people keep their place across a wide column or a long passage, while less space helps several lines fit where height is tight, such as a list row, though you should avoid tight leading once you show three or more lines.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.016
In interface mockups, you may need to adjust tracking. A running app’s system font changes tracking at every point size on its own, so an accurate mockup of the variable system fonts does not require a discrete optical size at particular point sizes, though tracking may still need a tweak.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.017
Custom fonts must stay easy to read at different distances and under different conditions, and while you use one, follow the recommended minimum sizes for the relevant styles and weights.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.018
Custom fonts should implement the accessibility behaviors system fonts already handle, including Dynamic Type where it is available and a response when Bold Text is on. In a Unity-based game, support Dynamic Type with the available plug-in, and if that plug-in does not fit, still let players resize text another way.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.019
Make the layout adapt to every font size, with text and glyphs staying legible throughout. On iPhone or iPad, enable Larger Accessibility Text Sizes, then open Larger Text inside Display & Text Size (under Accessibility in Settings) and confirm the app stays comfortably readable.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.020
As the font grows, enlarge interface icons that carry important information so they stay easy to see, and when you use symbols that respond to Dynamic Type, those icons scale on their own as the size changes.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.021
Limit truncation as the font grows, aiming to reveal a similar amount of useful copy at the biggest accessibility size and at the biggest standard size. Avoid clipping copy inside regions that scroll unless another view can show the remainder, and let a label take however many lines a useful amount requires.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.022
At large sizes in a narrow layout, inline items such as glyphs and timestamps, plus the container edges, can crowd text into truncation or overlap, so consider stacking the text above secondary items. Multicolumn text also gets harder to read, so reduce how many columns you use when the size grows.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.023
Keep the information hierarchy stable at any font size — for example, leave the main elements near the upper edge of a view even at a very large size, so people do not lose track of them.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.024
When text should match standard controls, use dynamic system font variants, which share the appearance of copy inside system-provided controls, and use the variants below so the result feels like the rest of the platform.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.025
One macOS dynamic system font is called Control content.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.026
One macOS dynamic system font is called Label.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.027
One macOS dynamic system font is called Menu.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.028
One macOS dynamic system font is called Menu bar.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.029
One macOS dynamic system font is called Message.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.030
One macOS dynamic system font is called Palette.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.031
One macOS dynamic system font is called Title.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.032
One macOS dynamic system font is called Tool tips.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.033
One macOS dynamic system font is Document text, also known as user.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.034
One macOS dynamic system font is Monospaced document text, also known as user fixed pitch.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.035
One macOS dynamic system font is called Bold system font.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.036
One macOS dynamic system font is called System font.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.037
Prefer 2D text in general, because greater visual depth makes characters harder to read; a little 3D type can be a fun accent, but anything people must read and understand should have little or no depth.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.038
Text should still look good and stay legible after people scale it: choose a style that looks right at full scale, then check other scales.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.039
Push contrast as high as you can between lettering and whatever fills the container behind it. White lettering is the default because it usually stands out against the system’s standard backdrop material and is easier to read; test any other color in many contexts.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.040
If text sits on no background, consider a bold weight so it stays legible, and generally skip shadows for contrast, because the current space may lack a surface for an accurate shadow and you cannot predict a size and density that will suit the person’s Environment.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.041
Keep text aimed at people whenever you can. For copy anchored at a spatial point — a name hovering over a 3D object, for example — billboard it so it faces the wearer however they or the object move; a side view or a steep angle can make it unreadable, just as a label over a virtual lamp on a real desk must spin around the y-axis until its baseline sits perpendicular to the wearer’s gaze.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.042
On macOS, Large Title is Regular at 26 pt, with a line height of 32 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.043
On macOS, Title 1 is Regular at 22 pt, with a line height of 26 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.044
On macOS, Title 2 is Regular at 17 pt, with a line height of 22 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.045
On macOS, Title 3 is Regular at 15 pt, with a line height of 20 pt, and the emphasized weight is Semibold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.046
On macOS, Headline is Bold at 13 pt, with a line height of 16 pt, and the emphasized weight is Heavy.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.047
On macOS, Body is Regular at 13 pt, with a line height of 16 pt, and the emphasized weight is Semibold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.048
On macOS, Callout is Regular at 12 pt, with a line height of 15 pt, and the emphasized weight is Semibold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.049
On macOS, Subheadline is Regular at 11 pt, with a line height of 14 pt, and the emphasized weight is Semibold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.050
On macOS, Footnote is Regular at 10 pt, with a line height of 13 pt, and the emphasized weight is Semibold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.051
On macOS, Caption 1 is Regular at 10 pt, with a line height of 13 pt, and the emphasized weight is Medium.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.052
On macOS, Caption 2 is Medium at 10 pt, with a line height of 13 pt, and the emphasized weight is Semibold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.053
On tvOS, Title 1 is Medium at 76 pt, with leading of 96 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.054
On tvOS, Title 2 is Medium at 57 pt, with leading of 66 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.055
On tvOS, Title 3 is Medium at 48 pt, with leading of 56 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.056
On tvOS, Headline is Medium at 38 pt, with leading of 46 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.057
On tvOS, Subtitle 1 is Regular at 38 pt, with leading of 46 pt, and the emphasized weight is Medium.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.058
On tvOS, Callout is Medium at 31 pt, with leading of 38 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.059
On tvOS, Body is Medium at 29 pt, with leading of 36 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.060
On tvOS, Caption 1 is Medium at 25 pt, with leading of 32 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.061
On tvOS, Caption 2 is Medium at 23 pt, with leading of 30 pt, and the emphasized weight is Bold.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.062
For macOS, a 6 pt size uses +41 tracking in thousandths of an em and +0.24 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.063
For macOS, a 7 pt size uses +34 tracking in thousandths of an em and +0.23 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.064
For macOS, a 8 pt size uses +26 tracking in thousandths of an em and +0.21 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.065
For macOS, a 9 pt size uses +19 tracking in thousandths of an em and +0.17 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.066
For macOS, a 10 pt size uses +12 tracking in thousandths of an em and +0.12 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.067
For macOS, a 11 pt size uses +6 tracking in thousandths of an em and +0.06 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.068
For macOS, a 12 pt size uses 0 tracking in thousandths of an em and 0.0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.069
For macOS, a 13 pt size uses -6 tracking in thousandths of an em and -0.08 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.070
For macOS, a 14 pt size uses -11 tracking in thousandths of an em and -0.15 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.071
For macOS, a 15 pt size uses -16 tracking in thousandths of an em and -0.23 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.072
For macOS, a 16 pt size uses -20 tracking in thousandths of an em and -0.31 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.073
For macOS, a 17 pt size uses -26 tracking in thousandths of an em and -0.43 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.074
For macOS, a 18 pt size uses -25 tracking in thousandths of an em and -0.44 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.075
For macOS, a 19 pt size uses -24 tracking in thousandths of an em and -0.45 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.076
For macOS, a 20 pt size uses -23 tracking in thousandths of an em and -0.45 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.077
For macOS, a 21 pt size uses -18 tracking in thousandths of an em and -0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.078
For macOS, a 22 pt size uses -12 tracking in thousandths of an em and -0.26 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.079
For macOS, a 23 pt size uses -4 tracking in thousandths of an em and -0.10 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.080
For macOS, a 24 pt size uses +3 tracking in thousandths of an em and +0.07 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.081
For macOS, a 25 pt size uses +6 tracking in thousandths of an em and +0.15 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.082
For macOS, a 26 pt size uses +8 tracking in thousandths of an em and +0.22 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.083
For macOS, a 27 pt size uses +11 tracking in thousandths of an em and +0.29 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.084
For macOS, a 28 pt size uses +14 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.085
For macOS, a 29 pt size uses +14 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.086
For macOS, a 30 pt size uses +14 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.087
For macOS, a 31 pt size uses +13 tracking in thousandths of an em and +0.39 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.088
For macOS, a 32 pt size uses +13 tracking in thousandths of an em and +0.41 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.089
For macOS, a 33 pt size uses +12 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.090
For macOS, a 34 pt size uses +12 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.091
For macOS, a 35 pt size uses +11 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.092
For macOS, a 36 pt size uses +10 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.093
For macOS, a 37 pt size uses +10 tracking in thousandths of an em and +0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.094
For macOS, a 38 pt size uses +10 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.095
For macOS, a 39 pt size uses +10 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.096
For macOS, a 40 pt size uses +10 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.097
For macOS, a 41 pt size uses +9 tracking in thousandths of an em and +0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.098
For macOS, a 42 pt size uses +9 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.099
For macOS, a 43 pt size uses +9 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.100
For macOS, a 44 pt size uses +8 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.101
For macOS, a 45 pt size uses +8 tracking in thousandths of an em and +0.35 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.102
For macOS, a 46 pt size uses +8 tracking in thousandths of an em and +0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.103
For macOS, a 47 pt size uses +8 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.104
For macOS, a 48 pt size uses +8 tracking in thousandths of an em and +0.35 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.105
For macOS, a 49 pt size uses +7 tracking in thousandths of an em and +0.33 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.106
For macOS, a 50 pt size uses +7 tracking in thousandths of an em and +0.34 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.107
For macOS, a 51 pt size uses +7 tracking in thousandths of an em and +0.35 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.108
For macOS, a 52 pt size uses +6 tracking in thousandths of an em and +0.31 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.109
For macOS, a 53 pt size uses +6 tracking in thousandths of an em and +0.33 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.110
For macOS, a 54 pt size uses +6 tracking in thousandths of an em and +0.32 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.111
For macOS, a 56 pt size uses +6 tracking in thousandths of an em and +0.30 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.112
For macOS, a 58 pt size uses +5 tracking in thousandths of an em and +0.28 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.113
For macOS, a 60 pt size uses +4 tracking in thousandths of an em and +0.26 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.114
For macOS, a 62 pt size uses +4 tracking in thousandths of an em and +0.24 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.115
For macOS, a 64 pt size uses +4 tracking in thousandths of an em and +0.22 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.116
For macOS, a 66 pt size uses +3 tracking in thousandths of an em and +0.19 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.117
For macOS, a 68 pt size uses +2 tracking in thousandths of an em and +0.17 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.118
For macOS, a 70 pt size uses +2 tracking in thousandths of an em and +0.14 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.119
For macOS, a 72 pt size uses +2 tracking in thousandths of an em and +0.14 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.120
For macOS, a 76 pt size uses +1 tracking in thousandths of an em and +0.07 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.121
For macOS, a 80 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.122
For macOS, a 84 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.123
For macOS, a 88 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.124
For macOS, a 92 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.125
For macOS, a 96 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.126
For tvOS, a 6 pt size uses +41 tracking in thousandths of an em and +0.24 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.127
For tvOS, a 7 pt size uses +34 tracking in thousandths of an em and +0.23 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.128
For tvOS, a 8 pt size uses +26 tracking in thousandths of an em and +0.21 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.129
For tvOS, a 9 pt size uses +19 tracking in thousandths of an em and +0.17 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.130
For tvOS, a 10 pt size uses +12 tracking in thousandths of an em and +0.12 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.131
For tvOS, a 11 pt size uses +6 tracking in thousandths of an em and +0.06 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.132
For tvOS, a 12 pt size uses 0 tracking in thousandths of an em and 0.0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.133
For tvOS, a 13 pt size uses -6 tracking in thousandths of an em and -0.08 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.134
For tvOS, a 14 pt size uses -11 tracking in thousandths of an em and -0.15 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.135
For tvOS, a 15 pt size uses -16 tracking in thousandths of an em and -0.23 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.136
For tvOS, a 16 pt size uses -20 tracking in thousandths of an em and -0.31 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.137
For tvOS, a 17 pt size uses -26 tracking in thousandths of an em and -0.43 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.138
For tvOS, a 18 pt size uses -25 tracking in thousandths of an em and -0.44 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.139
For tvOS, a 19 pt size uses -24 tracking in thousandths of an em and -0.45 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.140
For tvOS, a 20 pt size uses -23 tracking in thousandths of an em and -0.45 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.141
For tvOS, a 21 pt size uses -18 tracking in thousandths of an em and -0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.142
For tvOS, a 22 pt size uses -12 tracking in thousandths of an em and -0.26 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.143
For tvOS, a 23 pt size uses -4 tracking in thousandths of an em and -0.10 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.144
For tvOS, a 24 pt size uses +3 tracking in thousandths of an em and +0.07 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.145
For tvOS, a 25 pt size uses +6 tracking in thousandths of an em and +0.15 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.146
For tvOS, a 26 pt size uses +8 tracking in thousandths of an em and +0.22 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.147
For tvOS, a 27 pt size uses +11 tracking in thousandths of an em and +0.29 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.148
For tvOS, a 28 pt size uses +14 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.149
For tvOS, a 29 pt size uses +14 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.150
For tvOS, a 30 pt size uses +14 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.151
For tvOS, a 31 pt size uses +13 tracking in thousandths of an em and +0.39 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.152
For tvOS, a 32 pt size uses +13 tracking in thousandths of an em and +0.41 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.153
For tvOS, a 33 pt size uses +12 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.154
For tvOS, a 34 pt size uses +12 tracking in thousandths of an em and +0.40 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.155
For tvOS, a 35 pt size uses +11 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.156
For tvOS, a 36 pt size uses +10 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.157
For tvOS, a 37 pt size uses +10 tracking in thousandths of an em and +0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.158
For tvOS, a 38 pt size uses +10 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.159
For tvOS, a 39 pt size uses +10 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.160
For tvOS, a 40 pt size uses +10 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.161
For tvOS, a 41 pt size uses +9 tracking in thousandths of an em and +0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.162
For tvOS, a 42 pt size uses +9 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.163
For tvOS, a 43 pt size uses +9 tracking in thousandths of an em and +0.38 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.164
For tvOS, a 44 pt size uses +8 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.165
For tvOS, a 45 pt size uses +8 tracking in thousandths of an em and +0.35 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.166
For tvOS, a 46 pt size uses +8 tracking in thousandths of an em and +0.36 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.167
For tvOS, a 47 pt size uses +8 tracking in thousandths of an em and +0.37 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.168
For tvOS, a 48 pt size uses +8 tracking in thousandths of an em and +0.35 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.169
For tvOS, a 49 pt size uses +7 tracking in thousandths of an em and +0.33 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.170
For tvOS, a 50 pt size uses +7 tracking in thousandths of an em and +0.34 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.171
For tvOS, a 51 pt size uses +7 tracking in thousandths of an em and +0.35 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.172
For tvOS, a 52 pt size uses +6 tracking in thousandths of an em and +0.31 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.173
For tvOS, a 53 pt size uses +6 tracking in thousandths of an em and +0.33 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.174
For tvOS, a 54 pt size uses +6 tracking in thousandths of an em and +0.32 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.175
For tvOS, a 56 pt size uses +6 tracking in thousandths of an em and +0.30 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.176
For tvOS, a 58 pt size uses +5 tracking in thousandths of an em and +0.28 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.177
For tvOS, a 60 pt size uses +4 tracking in thousandths of an em and +0.26 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.178
For tvOS, a 62 pt size uses +4 tracking in thousandths of an em and +0.24 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.179
For tvOS, a 64 pt size uses +4 tracking in thousandths of an em and +0.22 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.180
For tvOS, a 66 pt size uses +3 tracking in thousandths of an em and +0.19 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.181
For tvOS, a 68 pt size uses +2 tracking in thousandths of an em and +0.17 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.182
For tvOS, a 70 pt size uses +2 tracking in thousandths of an em and +0.14 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.183
For tvOS, a 72 pt size uses +2 tracking in thousandths of an em and +0.14 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.184
For tvOS, a 76 pt size uses +1 tracking in thousandths of an em and +0.07 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.185
For tvOS, a 80 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.186
For tvOS, a 84 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.187
For tvOS, a 88 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.188
For tvOS, a 92 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.189
For tvOS, a 96 pt size uses 0 tracking in thousandths of an em and 0 pt of tracking.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.190
On December 16, 2025, each platform’s Dynamic Type style specifications gained emphasized weights.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.191
On March 7, 2025, guidance for Dynamic Type was expanded.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.192
On June 10, 2024, the page gained help for Dynamic Type through Apple’s Unity plug-ins inside a Unity-based game, plus stronger notes on billboarding for a visionOS app or game.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.193
On September 12, 2023, artwork showing system font weights was added, and the wording that describes the tvOS specification tables was clarified.
Source: https://developer.apple.com/design/human-interface-guidelines/typography

### typography.194
On June 21, 2023, the page was updated with guidance for visionOS.
Source: https://developer.apple.com/design/human-interface-guidelines/typography
