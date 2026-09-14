# game-center

**Apple:** https://developer.apple.com/design/human-interface-guidelines/game-center  
**Gate:** `capability:gamecenter` — **not** `requiredIds`

Do not reimplement Game Center chrome. Link the system UI. Web CSS admin skips.

## Apply-in-host

| Host | Do |
|---|---|
| Games / GameKit | Use Game Center for identity, leaderboards, achievements |
| Web | Skip this surface |
