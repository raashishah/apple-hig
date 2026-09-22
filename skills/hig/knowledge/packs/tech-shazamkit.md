# tech-shazamkit

**Apple:** [ShazamKit](https://developer.apple.com/design/human-interface-guidelines/shazamkit)  
**Gate:** `capability:shazam` on surface `shazamkit`. Unknown hosts skip. Skip-unless affordance `shazam` (`data-shazam`, `SHSession`, `SHManagedSession`). `import ShazamKit` is the capability, not the widget. iCloud song-library opt-in stays off this pack. Do not complete a microphone permission sheet.

People let the app record a sample for recognition. The microphone does not stay on after that sample.

## Do

- Stop recording as soon as the sample is recognized.
- Record only for as long as it takes to get the sample.

## Don't

- A microphone that stays on after the recognition sample.
