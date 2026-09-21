# patterns-workouts

**Apple:** [Workouts](https://developer.apple.com/design/human-interface-guidelines/workouts)  
**Surface id (later):** `workouts`  
**Compose with:** packed activity-rings when the same chrome already exists; do not treat packed HealthKit, packed Activity rings, or a progress bar as this pack  
**Gate (later):** `always` when the host has workout chrome (`HKWorkoutSession`, `HKWorkout`, `WorkoutKit`, `data-workout`); skip otherwise

Workouts keep people on the active session and discard sessions that end a few seconds after they start. Do not invent a workout session. Do not pack the Activity-rings bullet. Do not map this pack onto packed HealthKit or packed Activity rings.

## Apple guidance (1:1)

- Avoid distracting people from a workout with information that's not relevant. For example, people don't need to review the list of workouts you offer or access other parts of your app while they're working out.
- Discard extremely brief workout sessions. If a session ends a few seconds after it starts, either discard the data automatically or ask people if they want to record the data as a workout.
- Use Activity rings correctly stays on packed activity-rings. This pack does not invent rings.
- Host typeface stays. This pack does not rewrite fonts or inject a kit.

## Don't

- Distracting chrome during an active workout.
- Extremely brief workout sessions recorded.

## Apply in host

Map onto existing workout chrome (`HKWorkoutSession`, `HKWorkout`, `WorkoutKit`, `data-workout`). Do not invent a workout session, a metrics page, or a replica of Workout. Do not inject a kit.

| Host | Prefer |
|---|---|
| SwiftUI | Existing workout-session chrome when it already exists, not a custom replica of Workout |
| UIKit | `HKWorkoutSession` when it already exists |
| watchOS | Existing workout-session chrome when it already exists |
| Web | Existing `data-workout`, not packed Activity rings or a progress bar |

## Checklist

- [ ] A real workout widget exists before this pack applies
- [ ] Active sessions are not covered with other-app chrome
- [ ] Extremely brief sessions are not recorded as workouts
- [ ] Packed Activity rings and packed HealthKit stay themselves
