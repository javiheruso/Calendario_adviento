# Technical decisions — calendar core, parental panel, mission games, album and direct photo capture (P0–P11 + audit corrections)

Phase P0 fixed the stack, data contracts and local-first boundary. Phase P1 added the mobile-first 24-door calendar, the four approved day states, the star tree, local-date unlocks and an isolated adult demo mode. Phase P2 added the PIN-protected parental panel and the mission-status seam. Phase P3 added the first four games: day 2 memory, day 8 word scramble, day 16 jigsaw and day 18 bell Simon. Phase P4 added day 4 reindeer maze, day 6 spot the difference, day 10 ornament patterns and day 12 gift rain. Phase P5 added day 14 maths chest, day 19 hidden objects, day 21 absent-minded snowman and day 22 secret elf language. Phase P6 added the five physical challenge adaptations: day 3 red checklist, day 5 snowball fight, day 9 sock pairs, day 11 guided drawing and day 13 no laughing. Phase P7 added day 15 elf-hands pyramid, day 17 silent-elf charades, day 20 mystery bag and day 23 surprise for Trasto. This P8 slice added the two remaining approved game designs: day 1 elf dance and day 24 final mission. This P9 slice added the day 7 silly carol with optional camera/microphone recording. This P10 slice added the private local album: IndexedDB metadata and blobs, gallery import, preview, individual download, confirmed deletion, persistent-storage and quota reporting, a dependency-free ZIP export, and an explicit day 7 save after the recording succeeds. This P11 slice adds adult-only direct photo capture from the album: front camera by default, rear switch before capture, frozen review, an explicit save after confirmation, cancellation without saving and camera-track release on every exit path. The bounded audit pass adds visible repetition of completed missions without progress writes, a persistent adult-preview bar with a locking child-calendar exit, a local parental camera/recording switch, invisible coordinate hit areas for day 19 and late-track cleanup for day 7. This accessibility and resilience slice adds view-level focus management, milestone-only screen-reader announcements for live counters, accessible symbol/letter descriptions for days 22 and 24, 44 px minimum targets on compact controls, and a recovery boundary that returns the family to the calendar without exposing error details.

**Outcome:** the app builds to a static, local-only calendar where an adult can configure hints, hiding spots, manual unlocks and the optional camera behind a PIN, preview or demo any mission without touching child progress, and the child can play all twenty-four real touch-and-mouse games whose success opens the existing hint and gift/star flow. Completed missions can be replayed without changing or duplicating the star. The family can keep photos and videos per day, take new photos from the unlocked album when the parental switch allows it, and day 7 can save its recording to the private album only after the browser confirms the write. No media is uploaded or exposed in child mode.

## Quick path

1. Read `Scope of this slice` to confirm what is intentionally missing.
2. Read `Navigation and adult surfaces` before changing unlock, demo or preview behaviour.
3. Read `Mission flow` before changing the `status` branch.
4. Run `npm run build`, `npm run lint` and `npm test`.

## Scope of this slice

| Delivered | Out of scope |
|-----------|--------------|
| Mobile-first grid of 24 doors and four day states | Video capture from the album panel (day 7 keeps its own recording) |
| Local December 2026 date and access to previous days | Real audio, music and narration |
| Star tree with one star per day and real pending progress | Final local audio/music, licensed assets and the authorized carol |
| Persisted child progress plus an isolated demo store | PIN change, PIN recovery and multi-user accounts |
| First-time parental PIN setup, session unlock and lock | Automated DOM/component test runner |
| Adult panel for main hint, location help, hiding spot and local camera/recording switch | PWA, offline and service worker |
| Per-day manual unlock toggle | Backend, sync or external services |
| Mission preview against the demo store with a persistent adult label and locking exit | Deployment or release work |
| Completed missions repeatable without mutating progress or adding stars | — |
| `MissionDefinition.status` branch and populated game registry | Sonar-style cryptographic secrecy for a local PIN |
| Days 1 through 24 implemented as real games | Real-device camera, microphone and storage QA |
| Day 7 camera/microphone recording with track cleanup and explicit album save | ZIP64 archives, compression and cloud backup |
| Private album behind the parental PIN: metadata and blobs in IndexedDB | Media encryption at rest |
| Multiple photos/videos per day, day/date listing and preview | — |
| Adult-only direct photo capture with front default and rear switch | — |
| Frozen capture preview, explicit save and cancel-without-saving | — |
| Gallery file-picker import, individual download and confirmed deletion | — |
| Dependency-free ZIP32 export with individual-download fallback | — |
| Persistent-storage request, quota detection and export warning | — |
| Visible save-failure reporting for PIN, config, progress and media | — |
| Domain, game-rule, PIN, album, capture, ZIP, adapter and storage tests | — |

## Stack

| Topic | Decision | Why |
|-------|----------|-----|
| UI | React 19 + TypeScript, built with Vite | Approved stack; static output and a fast dev loop |
| Rendering | Single-page app, local view state, no router | Calendar, mission, gate and panel are local views; a router would add a dependency without a URL requirement |
| Hosting | Static HTTPS on GitHub Pages, no backend | Approved target; all data stays local |
| Styling | Plain CSS, mobile-first, safe-area padding | No CSS framework needed for a small touch-first UI |
| Build base | `VITE_BASE_PATH` drives `base`; the Pages workflow sets `/<repository>/` and local builds fall back to `./` | Project Pages needs the repository segment; deriving it in the workflow survives a repository rename |
| Deployment | GitHub Actions builds `dist/` with `npm ci` and deploys it with `upload-pages-artifact` + `deploy-pages` | No branch publishing, no build artifacts in the repository and no extra dependency; see `docs/DEPLOYMENT.md` |
| Offline / PWA | Deferred | Not an approved requirement; no manifest or service worker |
| Dependencies | Only React runtime + standard tooling | The spec forbids unnecessary frameworks and infrastructure; the ZIP writer lives in the repository instead of adding a package |

## Local-first persistence

| Data | Storage | Rationale |
|------|---------|-----------|
| Child config, PIN and progress | `localStorage`, key `los24regalos:v1` | Small JSON document; synchronous read keeps first render simple |
| Demo and preview progress | `localStorage`, key `los24regalos:demo:v1` | Isolated data that can never grant or remove a child star |
| Album metadata and blobs | IndexedDB database `los24regalos-album`, stores `metadata` and `media` | Blobs do not belong in `localStorage`; the metadata store lists the album without loading every blob |
| Persistent storage | `navigator.storage.persist()` when available | Best effort only; a denial is shown, never hidden |
| Sync / upload | None | No backend and no private media ever leaves the device |

- The child snapshot carries `schemaVersion: 1` and an `AppState` shape.
- The demo snapshot carries `schemaVersion: 1` and only `progress`; configuration is always read from the live child config so a preview matches the real hints.
- Loading validates shape and discards anything unknown or from another version, falling back to defaults. A corrupted or tampered PIN record is discarded on load. A snapshot written before `parental.cameraEnabled` existed loads with the camera enabled, preserving the previous behaviour. There is no silent migration; a future schema change must add one before bumping the version.
- `saveAppState` and `saveDemoProgress` return `false` when the browser refuses to persist. The UI shows an alert instead of claiming the data was saved.
- `resetDemoProgress` returns `false` when the browser cannot clear the demo key; the panel shows the failure even though the in-memory reset still applies to the session.
- Demo data is stored separately on purpose. The demo-mode flag and the unlocked adult session are React session state, so a reload returns to the locked child calendar.
- Album media never enters `AppState` or `localStorage`. The album database has its own version (`ALBUM_DB_VERSION`); a future schema change must add an upgrade path before bumping it.
- Album operations reject with stable codes (`quota`, `unavailable`, `blocked`, `transaction`, `not-found`). The UI maps codes to family-facing messages and only reports success after the IndexedDB transaction resolves.
- The album asks for persistent storage when the adult opens it and, best effort, when day 7 saves a clip. The browser may still evict data; the album always recommends exporting.

## Data model

```
AppState
├─ schemaVersion
├─ config: AppConfig
│  ├─ parental: { pin: PinRecord | null, cameraEnabled: boolean }
│  └─ days: Record<MissionDay, DaySettings>
│     ├─ hidingSpot   (parent-only, rendered only in the adult panel)
│     ├─ hints        (main + optional location; null = not configured)
│     └─ manuallyUnlocked
└─ progress: ProgressState
   └─ days: Partial<Record<MissionDay, DayProgress>>
      ├─ missionCompletedAt
      ├─ giftFoundAt        → star (one record per day, so no duplicates)
      ├─ hintRevealedAt
      └─ locationHintRevealedAt
```

- `MissionDay` is the literal union `1…24`; `MISSION_DAYS` and `TOTAL_MISSIONS` derive from it.

```
AlbumMediaMetadata
├─ id            (unique album key)
├─ day           (MissionDay 1…24)
├─ kind          photo | video
├─ mimeType      (normalized; extension inferred when the browser omits it)
├─ fileName      (sanitized download name)
├─ byteSize
├─ createdAt     (ISO timestamp)
└─ source        recording | import | capture
```

- Album metadata and blobs are stored outside `AppState`. The `metadata` store has no blobs; the `media` store has `{ id, blob }`.
- `src/domain/album.ts` validates day, size, date, id and MIME type, sanitizes names and derives day/kind ZIP names. It never performs storage or network work.
- `src/domain/missions.ts` keeps the 24 approved titles and mechanics as metadata. All 24 days are `status: 'implemented'`. The status branch remains in place so future planned work can still refuse to simulate a missing game.
- `src/domain/config.ts` exposes pure transitions: `updateDaySettings` patches one day, `setParentalPin` replaces the PIN record and `setCameraEnabled` toggles the local camera/recording preference. All return a new `AppConfig`.
- Progress transitions in `src/domain/progress.ts` are pure and immutable. Repeating a mission keeps the first timestamps and never adds a second star.
- `src/domain/calendar.ts` is the only module that knows the season. It compares **local** calendar dates (`getFullYear` / `getMonth` / `getDate`), so a door opens at local midnight, not at UTC midnight.
- `getTodayMissionDay` highlights today only; it is not an access rule.

### Day states

| Status | Meaning |
|--------|---------|
| `locked` | Local date is before the day (and no adult override) |
| `available` | Released and not completed |
| `mission-complete` | Mission done, gift not confirmed |
| `gift-found` | Gift confirmed; the day has its star |

Prior days stay available; an unfinished day never blocks a later one. A gift already found is shown even if the date rules would lock that day. Adult preview is session-only and never writes child progress. Parental manual unlock is stored per day in `config.days[day].manuallyUnlocked` and toggled from the adult panel.

## Navigation and adult surfaces

**No router.** `App.tsx` holds a `view` union:

```ts
type View =
  | { kind: 'calendar' }
  | { kind: 'mission'; day: MissionDay }
  | { kind: 'adult-gate' }
  | { kind: 'adult-panel' }
  | { kind: 'adult-album' }
  | { kind: 'preview'; day: MissionDay }
```

**Child flow stays closed.** The footer exposes a neutral "Zona de adultos" entry, never a demo toggle. The calendar no longer advertises demo mode. `demoMode` and the unlocked session are React state and are never persisted.

**Defence in depth.** `effectiveDemoMode = adultUnlocked && demoMode`, and `previewing = adultUnlocked && view.kind === 'preview'`. If the session is not unlocked, the panel and preview cannot render and the demo store cannot replace child progress. `showAdultGate` also renders the gate if a stale view points at an adult surface, including the album, while locked.

**Private album surface.** `adult-album` is reachable only from the unlocked `AdultPanel`. It renders the album list, gallery import, direct photo capture, previews, downloads, deletion confirmations and ZIP export. The child calendar, mission panel and footer never render album media, a camera surface or a link to the list. Direct capture mounts only inside `AlbumPanel`, so the child flow never requests camera permission. Day 7 may offer to save its own new recording from the mission result, but that write does not expose any existing memory and success is reported only after IndexedDB resolves.

**Adult demo mode**

| Property | Behaviour |
|----------|-----------|
| Activation | Only from the unlocked adult panel |
| Unlocks | `adultPreview: true`, so every day opens without waiting |
| Progress | Separate demo store; never calls `saveAppState` |
| Config | Reads the live child hints so the preview matches the real configuration; `hidingSpot` is never rendered outside the panel |
| Return to panel | Keeps the demo active so the panel can exit or reset it |
| Exit | Panel button, demo bar button or locking the panel |
| Reset | Clears `los24regalos:demo:v1` and reports a failed clear |

**Preview** opens a specific mission with `adultPreview: true`, uses the isolated demo store and returns to the adult panel. It never mutates child progress. Because preview and demo share the demo store, progress created in a preview is visible only in those adult surfaces. A persistent preview bar identifies the day and states that nothing is written to the child calendar. The mission back button is labelled "Volver al panel familiar", and a separate "Salir al calendario infantil y bloquear" action clears `adultUnlocked` and demo mode before returning to the child calendar.

## Parental PIN gate

- **First-time setup.** When no PIN exists, the gate asks for a 4–8 digit PIN and a confirmation. `createPinRecord` derives a `PBKDF2-SHA-256` hash with 120k iterations, a random 16-byte salt and a 256-bit key, then `setParentalPin` stores the record in the child config.
- **Session unlock.** When a PIN exists, the gate verifies it with `verifyPin`. A correct PIN unlocks the panel for the current session only; a reload locks it again.
- **Session lock.** "Bloquear panel" clears the unlocked session and demo mode and returns to the child calendar.
- **Storage failure.** If the browser rejects the save during setup, the panel stays usable for the session but shows a warning that the PIN was not saved and will be lost on reload. If a config edit or progress save fails, the global alert says so; the UI never claims a successful save.
- **No recovery in this slice.** There is no PIN change or reset flow. Clearing browser storage resets the PIN and also erases local progress, which the documentation states instead of promising recovery.
- **Security posture.** The digits are not stored in clear text, but anyone with browser-storage access can replace or remove the record. This is a household barrier for a shared family device, not cryptographic security.
- **Secure context.** Web Crypto needs HTTPS in production or `localhost` in development. If it is unavailable, PIN creation fails visibly and verification cannot succeed.

## Mission flow

1. A door opens the generic mission panel.
2. The panel shows the mission title, day, illustration, state and a short generic narrative. The final `ui.frame.general` artwork is the hero container: the frame holds the day, title, brief and main illustration, with Trasto slightly overlapping the lower edge. Games and reward actions stay below the frame, so the decorative artwork is never an empty placeholder.
3. `resolveMissionAvailability` decides the stage:

   | Mission status | Surface | Stage |
   |----------------|---------|-------|
   | `implemented` | Any | Real game through the `MISSION_GAMES` registry |
   | `planned` | Demo or development | Clearly labelled demo/dev completion |
   | `planned` | Production child | Honest "not available yet" notice |

4. Registration seam: `src/components/missionGames.ts` maps a `MissionKind` to a game component. It currently registers `dance`, `memory`, `red-outfit`, `reindeer-maze`, `snowball-toss`, `spot-difference`, `karaoke`, `word-scramble`, `sock-pairs`, `patterns`, `guided-drawing`, `catch-gifts`, `no-laugh`, `jigsaw`, `bell-simon`, `math-lock`, `hidden-objects`, `snowman-build`, `symbol-cipher`, `cup-pyramid`, `charades`, `touch-bag`, `craft` and `finale`. Registering a game is the only step that makes an `implemented` entry playable.
5. Game contract: every game receives `{ mission, cameraEnabled, onComplete }`. The game owns its rules and calls `onComplete` only after its success condition; it never writes progress directly. The panel then marks the mission complete through the existing `completeMission` transition, so demo/preview isolation and first-timestamp preservation still apply. When the child chooses "Repetir misión", the panel remounts the game with a local completion callback instead of `onCompleteMission`; the replay cannot call a progress transition.
6. Before the mission starts, if no main hint is configured, the panel shows an adult configuration warning. After completion the main hint can be revealed and the reveal timestamp is persisted; if it is still missing, the same warning appears at the reward step. The app never displays an invented location.
7. The optional location hint is shown only when configured.
8. Gift confirmation stays available after mission completion even when the hint is missing, because an adult may give the clue verbally. The warning is informational; the app never fabricates a location.
9. "I found the gift" awards the day's star. `confirmGiftFound` keeps the first timestamp, so repeated confirmations never duplicate the star. Replaying a completed mission shows a visible repetition state and a final notice; it keeps the existing star and timestamps untouched.
10. The star tree uses the final fir artwork as a `position: relative`, 2:3 container. `src/domain/starTreeLayout.ts` owns exactly 24 percentage positions, and every star (off or on) is rendered from the start as an absolutely positioned overlay. Only `hasStar`/`progress.days[day].giftFoundAt` switches the artwork; the counter, pending days and full-set celebration are unchanged. There is no separate horizontal star row.

### Implemented games

| Day | Game | Rules | Touch / mouse |
|-----|------|-------|---------------|
| 1 | Elf dance | Three-second countdown; approved cues at 04/08/12/16/20/24/28/32/36/40/44/48 s; statue pause at 32→36; final pose and celebration; restart or repeat; no camera, audio or recording | Tap start, restart or repeat |
| 2 | Memory | 12 cards, 6 pairs with the final card back and existing final Rodolfo/snowman/gift/star/bell/tree art; a mismatch flips back after a pause; no timer or attempt limit | Tap or click each card |
| 3 | Red invasion | Manual checklist for two red garments and one red object; explicit family confirmation; no camera or automatic validation | Tap the three large checklist items, then confirm |
| 4 | Reindeer maze | 9×11 horizontal snowy forest with branches and false exits; collect 3 carrots, then reach the stable; blocked steps are ignored; a held direction repeats one valid step every 160 ms without skipping cells or crossing pines; two final walk frames alternate every 175 ms only while moving and Rodolfo slides between cells, facing the walking direction (the source art faces left, so rightward steps are mirrored); light CSS snow respects reduced motion; no timer | Tap a neighbouring cell, the four large direction buttons, or hold a direction with mouse/touch/assistive click |
| 5 | Snowball fight | Five paper balls per round; three hits win; adult marks inside/outside; a short round is retried without penalty | Two large adult buttons, inside and outside |
| 6 | Spot the difference | 7 approved changes measured on the final `taller_A`/`taller_B` images; marking either illustration marks both; zone hint; single-image view for small screens; no penalty | Tap or click a change on either picture |
| 7 | Silly carol | 3-second countdown plus a provisional 72-second lyric; six 12-second style blocks in approved order (robot, mouse, giant, sleepy, laugh, pop star); finishing completes without penalty; `KARAOKE_CONTENT_CONFIG` is the only seam for an authorized lyric source, instrumental/guide track and timing and currently declares `authorized: false` with no track; optional front/rear-camera recording with preview, explicit album save after success and individual download; the parental switch can hide the recording section without a permission request | Tap start, repeat, the opt-in recording controls and the album-save button when a clip exists; live preview is muted |
| 8 | Word scramble | RENO, NIEVE, REGALO with individual wooden tiles (not a stretched board image), a separate slot row, a tray and solved/empty/filled states; a large clue image is the protagonist; a correct word shows feedback and auto-advances after 1.5 s with a one-shot guard | Tap or click letters and slots |
| 9 | Sock pairs | Five pairs among ten socks; a mismatch clears after a pause; a playful 60-second timer can be extended or restarted and never gates success | Tap or click two socks |
| 10 | Ornament patterns | The five approved sequences ABABA, ABCAB, AABAA, ABBAB, ABCABCA on the final conveyor belt; star, bell and tree differ by shape and colour; choose the next token; retries unlimited | Tap or click a token |
| 11 | Guided drawing | Closed-eyes reindeer on the approved 0/5/15/25/35/45/55/65-second script; repeat or extend any step; manual finish always available | Start, pause, repeat, extend, reset and finish buttons |
| 12 | Gift rain | Move the final basket horizontally; catch 15 red/blue/green/gold gifts; fall speed and spawn rate grow smoothly; no lives, penalty or time limit | Drag or point inside the field, or use two arrow buttons |
| 13 | No laughing | Two 30-second rounds; no tickling; the timer or a manual button ends each round; both rounds complete with no mandatory winner | Start the round, end it early or use the timer |
| 14 | Maths chest | Discover star = 2 from tree = 5, gift = 3 and reindeer = 4; solve 6, 9 and 5; enter code 695; final chest closed/open and lock artwork; progressive help; no penalty | Tap or click number keys and lock digits |
| 15 | Elf hands | Build the 3–2–1 pyramid with six cups while wearing socks or mittens; mark the three rows, confirm manually; playful 60-second timer can be extended or restarted | Tap or click row, timer, restart and confirmation buttons |
| 16 | Jigsaw | 3×3 final portrait cut by code with the original 3:2 ratio (no stretching); any two pieces swap; model view is read-only | Tap two pieces or drag one onto another |
| 17 | Silent elf | Three distinct animals drawn from the exact twelve-animal bank (elephant, cat, dog, lion, monkey, penguin, rabbit, hen, gorilla, duck, frog, reindeer) with final images; every card face down by default; shown only while the actor holds the control and hidden on release/cancel/outside/focus/visibility change; the manual hit stays disabled until a show → hide cycle completed; no revealing audio; no camera | Hold the reveal button with pointer or space/enter, then tap the confirmed-hit button |
| 18 | Bell Simon | 4 final bell images as buttons hung on the final stand's rings (no checkboxes); 5 cumulative rounds of 2 to 6 notes; replay and retry after a miss; playback, correct and wrong presses add illumination and a short sway without adding sound | Tap or click the four bells |
| 19 | Hidden objects | Find the gift (centre), bell (left shelf), candy cane (behind the green cup), Santa hat (top), blue bauble (top right) and star (above the staircase) in the final scene; normalized hotspots; zoom and pan controls; zone hint; the six objects are invisible hit areas until found | Tap or click the scene coordinates, zoom, and pan with the arrow pad |
| 20 | Mystery bag | Instructions, the final opaque sack and three manual marks only; the child surface lists no example objects. The family prepares three safe objects privately, the child identifies them by touch without looking, the sack opens on completion and marks can be undone; no camera | Tap or click the three manual hit markers |
| 21 | Snowman | Copito's fixed model: top hat, carrot nose, red scarf and coal buttons; one large preloaded image per phase in a stable-ratio box, replaced on each correct choice, with no thumbnail history; complete phases `00_base`…`04_botones`; three complete options per phase, no overlays; observe 15 s; consult the model temporarily without losing state; unlimited retries | Tap or click one of three complete options per phase |
| 22 | Symbol cipher | Shared 14-symbol alphabet including Y = mistletoe; built-in A–Z keyboard; decipher LUNA, TRINEO and ESTRELLA, never listed in the intro; correct words auto-advance after 1.5 s with a one-shot guard; no penalty | Tap or click on-screen letters |
| 23 | Surprise for Trasto | Choose the final drawing, letter or craft; excited Trasto reacts to the choice; change it until an explicit manual confirmation; farewell art; no photos, video or camera | Tap or click one of three large options and the confirmation button |
| 24 | Final mission | Intelligence: reindeer = 4, code 64 and illustration-only operations with a separate table. Memory: three independent 3/4/5-note bell sequences on the shared day 18 stand, replay and retry. Magic: one nine-symbol cipher grouped 3-1-5 with visual spaces, one slot per letter, one verification and erase controls; the phrase is hidden from intro/help and manual pronunciation keeps a one-shot auto-advance. Crystals cross-fade between stable off/on images; the sleigh cross-fades from prepared to flying; no timer | Tap or click number keys, bells, cipher letters and manual confirmation buttons |

- Pure rules live in `src/domain/games/` and are independently testable: `dance.ts`, `memory.ts`, `redOutfit.ts`, `reindeerMaze.ts`, `snowballToss.ts`, `spotDifference.ts`, `karaoke.ts`, `karaokeRecording.ts`, `wordScramble.ts`, `sockPairs.ts`, `patterns.ts`, `guidedDrawing.ts`, `catchGifts.ts`, `noLaugh.ts`, `jigsaw.ts`, `bellSimon.ts`, `mathLock.ts`, `hiddenObjects.ts`, `snowman.ts`, `symbolCipher.ts`, `cupPyramid.ts`, `charades.ts`, `touchBag.ts`, `craftSurprise.ts`, `finalIntelligence.ts`, `finalMemory.ts`, `finalMagic.ts`, `finalMission.ts`, the shared `timer.ts` and `shuffle.ts`.
- Game state is local React state. Only mission completion is persisted, through the existing progress record.
- Day 3 keeps three independent checklist flags. The confirmation button appears only when all three are marked, and it never touches camera or media APIs.
- Day 4 requires all three carrots and the stable; arriving at the stable early only shows how many carrots are missing.
- Day 5 stores throws, hits and a `playing`/`won`/`round-lost` phase. Three hits finish the round immediately; five throws under three hits only offer a fresh round with five new balls.
- Day 9 stores ten socks in five pairs. Matching locks a pair, a mismatch clears after a short pause, and the countdown state is independent from the solved state.
- Day 6 stores `found` once per difference, so a change marked in one picture is shown as found in both. A wrong tap is feedback only. The zone hint iterates over the next unfound change and highlights a padded region, never the exact hotspot.
- Day 7 derives completion from the clamped countdown-plus-song timeline, so no score, microphone result or recording state can fail the mission. The lyric and six style blocks are provisional data; `KARAOKE_CONTENT_CONFIG` isolates the future authorized lyric source, instrumental/guide track and timing without touching the styles or recording flow. Recording is a separate opt-in UI layer built on the pure MIME/constraint helpers.
- Day 10 keeps the approved sequences and answers as data. A wrong token only shows feedback; the next pattern remains locked until the correct token is chosen and acknowledged.
- Day 11 derives each step duration from the approved absolute times. Extending adds time to the current step, repeating restarts it, and the manual finish flag is independent from `scriptComplete`.
- Day 12 uses a frame-capped simulation. Each catch raises the fall speed by a bounded step while the spawn interval shrinks, so the ramp is smooth and never becomes an instant loss. Missed gifts are counted but have no effect on completion.
- Day 13 stores a two-step round state machine. Finishing the first round only opens a break, never the mission success; the second finish completes both rounds regardless of who laughed.
- Day 18 is silent by design in this phase: bells use colours and tone labels, replaying shows the sequence again, and no background music plays during a sequence. Real tones belong to the pending audio phase.
- Day 16 uses `game.jigsaw.portrait` (the final 1536×1024 WebP) from the central asset catalog. CSS `background-position` cuts the nine pieces, and the board keeps the original 3:2 ratio so no fragment is stretched.
- Day 14 stores the approved values and operation terms once. The hidden value is not recorded until it is correct, and the chest opens only when the hidden value, all three operations and code 695 are complete. The operations render illustrations only; a separate equivalence table holds each drawing's value. The first aid points back to that table and the second states that the star is what fills the gap from 3 to 5.
- Day 19 uses the final scene image, six measured normalized object rectangles (gift centre, bell left shelf, candy cane behind the green cup, Santa hat top, blue bauble top right, star above the staircase) and a padded zone-hint rectangle. The scene is transformed by CSS for zoom and pan; the object rules stay independent of that visual state. Wrong taps are feedback only.
- Day 21 uses the fixed model and consecutive phases `00_base`…`04_botones`. It exposes a `SNOWMAN_OBSERVE_MS` constant of 15 seconds and switches from `observing` to `building` only after the observation. `snowmanPhaseImageIndex` exposes the single active phase; the component mounts all five complete images in one stable-ratio box (preloaded, no thumbnails) and only the active one is visible. Each phase offers three complete options; a wrong choice is feedback only and advances only on the correct option. The model view is temporary and never mutates the domain state.
- Day 22 keeps all fourteen symbol-letter pairs (including Y = mistletoe) in declaration order and derives each round from the same table. The words are LUNA, TRINEO and ESTRELLA and are not listed in the intro. The keyboard appends only up to the current word length; a correct word auto-advances after 1.5 s, and the manual button shares the one-shot guard so a round cannot advance twice.
- Day 15 derives the row order from `CUP_PYRAMID_ROWS = [3, 2, 1]`. Rows are marked in order, the finished stack becomes `ready`, and only the explicit `confirmCupPyramid` completes it. The timer reuse keeps zero harmless and supports extension or restart.
- Day 17 draws three distinct animals with the shared shuffle, keeps every card hidden by default, and hides the next card after a manual hit. There is no audio path at all, so no voice can reveal the answer, and no camera is requested.
- Day 20 stores one manual mark per identification slot. The domain and child UI no longer expose any example-object list; the family chooses the objects privately. The rules never claim to know what is inside the bag, and marks can be toggled before completion.
- Day 23 keeps the three handmade options in one domain list. A selection can be changed until `confirmCraftSurprise` locks it, and completion shows the farewell without any media API.
- Day 1 keeps the approved cue times in one immutable list. The 32→36 gap is modelled as the statue cue staying active for four seconds; the final pose opens a four-second celebration and then completion. The timeline is advanced by a local interval and cleaned up on unmount. No media API is imported.
- Day 24 reuses `bellSimon.ts` and the shared `BellStand` for the memory crystal's three independent 3/4/5-note sequences. The intelligence module keeps reindeer = 4 and code 64; its operations render illustrations only, with no numeric values, and the table stays independent. The magic module writes one nine-letter cipher grouped 3-1-5, verifies the whole phrase once, keeps every letter erasable before checking and never renders the phrase in the intro/help; after solving it reveals the phrase for manual pronunciation with no microphone or recognition. The crystals use stable off/on images, and the final scene cross-fades the prepared and flying sleigh before handing the child to the configured last hint.

## Reward, auto-advance and mobile layout (second integration phase)

| Topic | Decision | Why |
|-------|----------|-----|
| Persist before celebrate | `handleConfirmGift` writes the star through the existing progress transition and returns whether persistence succeeded. The reward UI only starts its return timer after a successful write. | A browser that refuses storage must keep the family on the reward screen instead of pretending the star was saved. |
| Double-press guard | The confirm button enters a local `confirmingGift` state, is disabled while busy, and `confirmGiftFound` remains idempotent. | A fast double tap cannot write twice or start two return timers. |
| Child-only return | `shouldReturnToCalendar(saved, demoMode)` is true only for a saved non-demo star. The mission panel waits `REWARD_RETURN_DELAY_MS` (1.8 s), then returns; preview/demo stays on the adult surface. | Preview must never contaminate child progress or move the child calendar unexpectedly. |
| Star focus and animation | The calendar focuses `[data-star-day="<day>"]`, scrolls it into view unless reduced motion is requested, and renders off/on star layers with a pop animation and a bumped counter. | The child sees which star was earned without hunting the tree. |
| Future audio seam | App dispatches `advent:star-earned` with `{ day, stars, total }`. No audio listener is wired yet. | The event is ready for a later audio layer without importing Web Audio into the domain. |
| Auto-advance | `useAutoAdvance(active, 1500, action)` arms one timer only while the success flag is true, reads the latest callback through a ref and clears the timer on unmount/restart. Days 8 and 22 use it, as do the three day 24 crystals after their own success state. | Correct steps advance without double triggers or orphan timers; wrong answers keep their attempts. |
| Mobile layout | A `max-width: 640px` block shrinks the logo, gaps, calendar banner and mission frame typography while keeping the title and brief inside the frame. Global `overflow-x: clip`, `max-width: 100%` media rules and a landscape-height block prevent horizontal overflow. | The app stays usable in portrait, landscape, tablet and desktop without duplicating title/brief or leaving an empty frame. |
| Pending | Bell-ring alignment, star animation timing, header proportions, maze feel and hold gestures were reasoned from the artwork/CSS but not visually verified on a browser or device. | No browser/device visual QA was available in this session. |

## Day 7 karaoke and optional recording

| Topic | Decision |
|-------|----------|
| Timeline | 3-second countdown plus a provisional 72-second lyric, 75 seconds total and inside the approved 60–90-second window. Six 12-second style blocks follow the approved order; the song end completes the mission with no score or penalty |
| Styles | Robot, mouse, giant, sleepy, laugh and pop star. Each shows a short child-facing instruction and a provisional catalog glyph |
| Recording opt-in | Unchecked by default. Marking the checkbox is the explicit action that requests permissions. The front camera is the default; the front/rear selector is only enabled before the song starts |
| Parental camera switch | `config.parental.cameraEnabled` gates the whole recording section. When false, no checkbox or camera control is rendered and no `getUserMedia` call is made; the song stays fully playable |
| Late camera request | A pending `getUserMedia` is invalidated when the song completes or the mission unmounts. If tracks arrive afterwards they are stopped immediately instead of attaching to a finished session; layout-effect refs close the window before a pending promise microtask |
| Media graph | `getUserMedia` requests video with `facingMode: { ideal }` plus audio. The microphone is routed through an `AudioContext` `MediaStreamDestination` when possible; the raw stream is the fallback if the mix cannot start |
| Container | Candidates prefer `video/webm` with VP9/VP8 plus Opus, then WebM, then MP4/QuickTime only when `isTypeSupported` reports support. No explicit preference means MediaRecorder chooses its own default; MP4 is never assumed |
| UI out of video | MediaRecorder receives the camera/microphone stream only. The karaoke DOM, lyrics, style cards and progress UI are never part of the recording |
| Failure handling | Missing APIs, denied permissions, video-only fallback, audio-mix failure, recorder errors and zero-byte blobs show a clear notice. The song, completion and repeat flow remain available |
| Preview and cleanup | The live preview is muted to avoid feedback. The recorded blob gets a temporary `objectURL` and a download link. Leaving the mission stops the recorder, camera/microphone tracks and audio context and revokes the URL |
| Album boundary | The clip stays temporary until the family taps an explicit save button. That button writes to IndexedDB through `onSaveRecording`; success is shown only when the promise returns `ok: true`. The download link remains a fallback, and existing album media is never exposed here |
| Album save failure | Missing IndexedDB, quota, blocked storage, a missing callback or a rejected transaction keep the clip unsaved and show a clear notice with a retry. The mission completion is independent from the save |

**Pending limits**

- The final authorized carol, instrumental base, music/voice mix and Trasto overlay are not implemented.
- Real-device QA remains: front/rear switching, separate camera and microphone denials, audio-context suspension, Safari MP4 vs Chromium WebM negotiation, long recordings, low storage, background/foreground changes, track release after exit and a slow permission request resolving after the song ends.
- Automated coverage is limited to pure timeline, MIME, constraint and capability rules plus the album-store save contract; no browser media or DOM test runner is installed.

## Private album (P10)

| Topic | Decision |
|-------|----------|
| Ownership | The album is a parental surface. `adult-album` is reachable only from the unlocked `AdultPanel`, and the child calendar, mission panel and footer never render album media |
| Storage | IndexedDB database `los24regalos-album`; `metadata` store for small records, `media` store for `{ id, blob }`. Saves and deletes touch both stores in one transaction |
| Multiple files | Any number of photos and videos per day, each tagged with `day`, `createdAt` and `source` (`recording`, `import` or `capture`) |
| Import | A hidden `<input type="file" accept="image/*,video/*" multiple>` opened by a large button. The adult chooses the mission day. It remains the fallback when camera capture is unavailable |
| Camera capture | Adult-only section in the album. The adult chooses the day, opens the front camera, may switch to the rear camera before capture, reviews a frozen image, and explicitly saves or discards it. The camera is never requested in the child flow |
| Listing | Grouped by mission day ascending; newest memory first inside a day. Each card shows kind, size, creation date and source |
| Preview | Lazy object URL created only when the card is expanded; image or video controls. The URL is revoked when the preview closes or the card leaves |
| Download | Each memory downloads individually with its sanitized original name. A missing blob is reported instead of downloading an empty file |
| Deletion | Inline confirmation before deleting. Success is reported only after the IndexedDB transaction resolves |
| ZIP export | In-repository ZIP32 writer using the STORE method (no compression). Entries are named `dia-07/foto-01.jpg`, `dia-07/video-01.webm`, plus `LEEME.txt`. No package or service is used |
| ZIP limits | Classic ZIP32: at most 65,535 entries and 4,294,967,295 bytes per file/offset. There is no ZIP64, compression or streaming. Limit failures are shown and the individual download remains available |
| ZIP verification | Automated tests parse names, contents and CRCs; a system `unzip -t` check was also run against a generated archive during P10 |
| Persistent storage | `navigator.storage.persist()` is requested when the adult opens the album and, best effort, when day 7 saves. `persisted()` and `estimate()` feed the panel. Unsupported, denied and estimate-failure states are all shown |
| Quota and failures | IndexedDB errors are mapped to `quota`, `unavailable`, `blocked`, `transaction` or `not-found`. A failed import or save never claims success; the panel suggests exporting and freeing space |
| Data-loss warning | The album states that clearing browser data, uninstalling or storage pressure can erase memories, and recommends periodic export |
| Privacy | No upload, backend, sync or external service. Object URLs are local; media stays in the browser database |
| Not included | Encryption at rest, import from a share sheet, ZIP64/compression, background backup, album video capture and executed real-device media QA (pending checklist in `docs/QA_CAMERA_CAPTURE.md`) |

## Direct photo capture (P11)

| Topic | Decision |
|-------|----------|
| Surface | The capture section lives inside `AlbumPanel`, reachable only through the unlocked parental panel. No child calendar, mission panel, preview or footer mounts the capture component |
| Parental camera switch | When `config.parental.cameraEnabled` is false, `AlbumPanel` shows a continuity notice instead of the capture form and `AlbumCameraCapture` also refuses to call `getUserMedia`. Gallery import remains available |
| Day selection | The adult picks any mission day 1–24 before opening the camera. The chosen day is stored in the new record's metadata |
| Camera default | `getUserMedia` requests video only (`audio: false`) with `facingMode: { ideal: 'user' }`. The front camera is the default; the rear camera is one tap away before capture |
| Camera switching | Switching stops the current stream before requesting the other side. A failure keeps the component open with a clear notice and a retry, and gallery import remains available |
| Preview | A muted, inline `playsInline` video shows the live stream. No microphone track is requested, so no audio is captured or monitored |
| Capture | The button freezes the current frame through `<video>` → `<canvas>` → `toBlob('image/jpeg', 0.9)`. Frames are clamped to 1600 px on the longest side without upscaling. The camera is stopped after a successful capture so the frozen image is reviewed without a live feed |
| Explicit save | The shot stays in memory and is never written automatically. Only the explicit "Guardar en el álbum privado" button calls the album store with `source: 'capture'`; success appears only after the IndexedDB transaction resolves |
| Discard and cancel | "Descartar y repetir" revokes the preview URL and reopens the camera. "Cancelar sin guardar" closes the section without touching storage. Both paths stop every track |
| Track release | Streams stop on capture success, facing change, retake, cancel, close and unmount. A request that resolves after unmount or after a newer request is stopped immediately |
| Failure handling | Missing `getUserMedia`, missing `canvas.toBlob`, permission denial, missing or busy camera, failed switch, empty frame, null blob, thrown `toBlob`, empty blob, quota, blocked storage and transaction failures all surface as notices. None blocks gallery import or the rest of the album |
| Privacy | No upload, backend, AI, sync or external service. Object URLs are local and revoked. The camera is absent from child mode by construction, not only by CSS |
| QA | The automated suite covers capability decisions, size clamping, file naming, the canvas/blob orchestration and storage acceptance. Real-device execution is documented in `docs/QA_CAMERA_CAPTURE.md` and remains pending |

Hiding spots are rendered only by the adult panel. Future-day hints are never rendered in the child calendar, and the child mission panel only reveals a hint after that mission is completed in the active (child) progress.

## Assets

`src/domain/assets.ts` remains the single source of truth for artwork keys and paths. The definitive WebP files live under `public/assets/final/` with their original subfolders; `recursos/` and the source ZIP stay git-ignored.

- Shared UI, doors, frames, logos, characters, backgrounds, mission illustrations and game entries all use `kind: 'image'` with a `public/`-relative path.
- The general mission frame is a full-strength hero background (`object-fit: fill` inside a 3:2 box, matching the 1536×1024 artwork), and the star tree overlays 24 percentage positions on the 1024×1536 final fir. Both keep the source aspect ratio, so no artwork is stretched.
- Images are lazy by default through `AssetGlyph` (`loading="lazy"`, `decoding="async"`). Only the current mission scene or phase passes `priority` and requests eager loading; the full artwork folder is never fetched at first paint.
- The day 6 and day 19 scenes are the final `taller_A`/`taller_B` and `escena_objetos` images; their hotspots are measured normalized rectangles. The day 16 jigsaw cuts the final portrait with CSS `background-position` and keeps the original 3:2 ratio.
- Day 2 reuses existing final Rodolfo, snowman, gift, star, bell and tree art because the final folder has no dedicated memory-pair set.
- Two entries stay emoji with `provisional: true` because no final asset exists: `game.final.santa` (Papá Noel for the intelligence crystal) and `game.maze.tree` (snowy pine). They are documented in the catalog labels and in the README.
- `resolveAssetPath` applies Vite's base URL, so components never build asset URLs themselves. No component hard-codes a media path or bypasses the central catalog.
- `test/assets.test.ts` checks that every `kind: 'image'` entry resolves to an existing, non-empty file under `public/`, and `npm run verify:pages` checks every declared catalog image against the built `dist/` output and serves it under the Pages base. The measured dimensions, alpha channels, hotspot crops, unused files and QA limits are recorded in `docs/ASSETS.md`.

## Audio system

`docs/AUDIO.md` owns the full design. The decisions that affect the rest of the app:

| Topic | Decision |
|-------|----------|
| Catalog | `src/domain/audioCatalog.ts` is the single source of truth for music, voice and effects. Every current entry is provisional; music and effects use synthesized tones and voice entries are silent placeholders |
| Manager | `src/audio/audioManager.ts` is the only Web Audio adapter. It creates or resumes the context only from a user interaction, never blocks game logic and degrades to silence with a clear message |
| Preferences | Music, voice, effects, master mute and volume live under `los24regalos:audio:v1`, separate from `AppState`. Corrupt snapshots fall back to defaults |
| Mixing | `resolveAudioMix` is the single gain rule. Music ducks to 25% only while a voice is audible; disabled voice or muted master never lowers the music |
| Effects | Fire-and-forget. App-level success and celebration cues run from explicit completion clicks; a failed effect cannot alter mission progress |
| Cleanup | `MissionAudioScope` stops mission-scoped audio on unmount or day change, and the app shell calls `stopAll` on unmount |
| UI | A child silence/volume bar plus accessible parental channel, volume, test and stop controls. Neither exposes hints, hiding places or album content |
| Pending | Recorded narration, licensed music, game-level audio wiring and real-device audio QA |

## Calendar date refresh

The local clock is captured in React state and refreshed every minute. This opens a door at local midnight without a reload and avoids reading an impure clock during render.

## Accessibility and error recovery

| Topic | Decision | Why |
|-------|----------|-----|
| View focus | Each open view receives focus on its `h1`/`h2` (`tabindex=-1`). Closing a mission, preview, album or parental surface restores focus to the door, day summary or album trigger that opened it. | Keyboard and screen-reader users keep their place instead of landing at the top of a remounted page. |
| Live counters | Visible dance, karaoke and timers may update every second, but only milestone announcements (for example 30 s, 10 s and zero) enter a polite live region. The visible seconds text is no longer a `role="status"`. | Prevents a screen reader from announcing every tick while keeping meaningful progress cues. |
| Cipher semantics | The fourteen symbols have stable Spanish accessible names. The reference table announces the full "symbol -> letter" row, while the secret word announces only the symbol names. | Days 22 and 24 become usable without sight without leaking the answer letter in the puzzle word. |
| Touch targets | Compact critical controls use a `44px` minimum: cipher keys, album card actions, camera-facing buttons, link-style navigation and check rows. | Meets the approved minimum target without changing the visual design or adding a dependency. |
| Recovery | A class error boundary wraps the app. It renders a clear recovery screen with "Volver al calendario" and "Recargar la página", remounts the app at the calendar view and never shows stack traces or internal details. | A broken mission cannot leave a blank screen or require a full data reset. |
| Tests | `test/a11y.test.ts` covers milestone announcements and the touch-target constant; the symbol-cipher suite covers the accessible names and reference descriptions. | Pure rules stay verifiable without a browser test runner. |

Screen-reader announcement timing, real touch ergonomics and browser error-boundary behaviour still need device QA; they are not claimed as covered by the domain tests.

## Tests

`npm test` uses only the installed toolchain:

1. `tsc -p tsconfig.test.json` compiles the domain, storage and security modules plus the tests into `test/.build` as CommonJS.
2. `node --test 'test/.build/test/**/*.test.js'` runs Node's built-in test runner.

No test framework or new dependency was added. `test/package.json` sets `"type": "commonjs"` so the root `"type": "module"` does not make the compiled output ESM. The build output is git-ignored.

Coverage includes:

- Local-midnight release, today detection, adult preview and manual unlock.
- The four day states and the "found gift stays visible" rule.
- One star per day, first-timestamp preservation and immutable transitions.
- Hint reveal persistence and star-tree completion.
- Star-tree layout: exactly 24 unique percentage positions, one per mission day, all inside the artwork and without collisions.
- UI structure: the mission frame wraps the title, brief, main illustration and Trasto; the tree scene is the relative 2:3 container for absolute stars; the final frame is a full hero background.
- Child/demo storage round-trips, corrupt data fallback, save failure, demo-reset failure and store isolation.
- PIN format, creation, verification, tamper rejection and storage round-trip.
- Pure config patches for hints, hiding spots, manual unlock and PIN storage.
- The 24-mission catalog, all twenty-four implemented days and the `status`-first availability rule.
- Day 7 karaoke: 60–90-second duration, contiguous provisional lyric, six style blocks, countdown and completion boundaries, restart, MIME negotiation and extension, camera constraints and recording capability fallbacks.
- Memory: deck composition, matching, mismatch resolution, idempotent flips and full completion.
- Red invasion: three independent checklist flags, unchecking and completion only with two garments plus one object.
- Snowball fight: five-ball rounds, three-hit wins, five-throw feedback rounds, ignored post-round throws and fresh retries.
- Sock pairs: ten-sock composition, pair locking, mismatch resolution, unlimited misses and five-pair completion.
- Guided drawing: approved absolute times, paused timelines, per-step extension, repeat, reset, full script completion and timer-independent manual finish.
- No laughing: two 30-second rounds, start/end gating, a break between rounds and completion without a winner condition.
- Timers: safe countdown creation, start/pause/zero clamping, extra time and clock formatting.
- Reindeer maze: 9×11 horizontal layout, reachable carrots/stable by state-space search, blocked and border steps, held-step safety constant, carrot collection without duplicates, stable-before-carrots rejection, full completion and the 150–200 ms walk-frame constant.
- Spot the difference: seven unique normalized rectangles, shared found state across both pictures, unlimited misses, zone-hint bounds and full completion.
- Word scramble: letter preservation, placement/removal, duplicate letters, wrong orders and per-word solving. A static UI contract checks individual wooden tiles, the hero clue and the auto-advance seam instead of a stretched board image.
- Patterns: the five approved sequences and answers, option derivation, wrong-choice retries, acknowledgement and full completion.
- Gift rain: basket clamping, aligned catches, harmless misses, bounded speed and spawn growth, deterministic spawning and completion at 15.
- Jigsaw: valid permutations, unsolved starts, reversible swaps, invalid swaps and solved detection.
- Bell Simon: cumulative round lengths, input gating, ordinary progress, unlimited retries, wrong-note recovery, five-round completion, four unique ring positions and correct/wrong/ignored press feedback.
- Maths chest: approved values, operations and code, hidden-value discovery, blocked operations, unlimited wrong answers, progressive aid cap, keypad length, and the combined success condition.
- Hidden objects: six unique normalized rectangles for the approved gift/bell/candy-cane/Santa-hat/blue-bauble/star scene, shared found state, unlimited misses, zone-hint bounds and full completion.
- Snowman: fixed model, 15-second observation, four consecutive phases with three complete options each, a single phase-image index that advances 0→4, building-stage gating, kind wrong-choice retries and completion after the last phase. A static UI contract verifies one large figure and the absence of thumbnail history.
- Symbol cipher: exactly fourteen unique symbol-letter pairs in specification order (including Y = mistletoe), accessible names and reference descriptions, LUNA/TRINEO/ESTRELLA sequences, keyboard length limit, wrong and incomplete answers, exactly-one advance per word and three-word completion. A static UI contract checks the auto-advance seam and that the intro does not list the answers.
- Elf-hands pyramid: approved 3–2–1 rows and six cups, ordered row marking, ready-before-confirmation gating, manual confirmation and penalty-free reset.
- Silent elf: the exact twelve-animal bank in approved order, three distinct random draws, hidden-by-default cards, reveal/hide idempotence, the show → hide confirmation gate, ignored premature hits, per-hit advancement with a reset gate and three-hit completion. A static UI contract checks pointer/keyboard handlers and the disabled confirm button.
- Mystery bag: three manual hit slots, independent toggling, undo support and completion only with all three marks.
- Surprise for Trasto: three handmade options, changeable selection, confirmation gated on a choice and locked after confirmation.
- Elf dance: exact approved cue times and labels, start-gated countdown, statue cue boundaries, celebration and completion windows, clamped timeline and restart behaviour.
- Final mission intelligence: approved values, operations and code 64, hidden reindeer discovery, blocked and incomplete codes, unlimited retries and completion.
- Final mission memory: three independent 3/4/5-note sequences, non-cumulative construction, reuse of the Simon retry rules and full completion.
- Final mission magic: one nine-letter cipher grouped 3-1-5 from the day 22 alphabet, single input/verification and erase controls, incomplete/wrong editing, one-shot solve, manual pronunciation gating and completion only after the cipher and pronunciation. A static UI contract checks that the phrase is not rendered before the solved pronunciation step.
- Final mission orchestration: the three required crystals in approved order, idempotent completion and final completion only with all three.
- Album domain: MIME/extension resolution, unsupported files, name sanitization, day/size/date/id validation, day grouping, sorting, export manifest names and byte formatting.
- Album capture: capability resolution, aspect-ratio size clamping, timestamped file names, and the full canvas/blob pipeline including not-ready, missing canvas, draw failure, null/throwing `toBlob` and empty-blob codes with mocks.
- Album store and adapter: save/list/delete round-trips, quota mapping, empty and missing-blob export failures, capture-source metadata acceptance, IndexedDB schema creation and unavailable-IndexedDB handling with in-memory and mock factories.
- ZIP writer: standard CRC-32, stored contents, UTF-8 names, an empty archive, the entry limit and the byte limit. A generated archive was also checked with the system `unzip -t` tool.
- Persistent storage: granted, denied, unsupported, existing grant, estimate failure and invalid estimate values.
- Accessibility helpers: the 44 px touch-target constant and milestone-only countdown announcements, including zero, custom checkpoints, fractional ticks and invalid values.
- Asset integrity: every `kind: 'image'` catalog entry resolves to an existing, non-empty file under `public/` with a browser-safe format; mission illustrations are final images.
- Reward flow: saved-child-only automatic return, failed-write/blocked navigation, the `advent:star-earned` payload, delayed return and the single-star repeat rule. The App source contract also checks the persisted-before-return wiring and preview isolation.
- Maths contracts: static checks that days 14 and 24 render no numeric values inside operations, keep a separate table and use the existing illustration keys. The approved values and results remain 2/695 and 4/64.
- Second integration UI contracts: static checks for the mobile CSS block, no overflow, the 9×11 maze source, wooden tiles, hold-to-reveal handlers, shared bell stand, single Copito figure, one-shot conjure and auto-advance seams.
- Star tree: day 24 owns the tip and is larger than the other 23 percentage stars.

There is still no automated DOM or component test runner. UI behaviour is verified by type-check, build and review; adding a browser test tool would be a separate, deliberate dependency decision.

## Verification

| Command | Covers |
|---------|--------|
| `npm run build` | Type-check (`tsc -b`) and static bundle |
| `npm run lint` | oxlint rules from the scaffold |
| `npm test` | Domain, calendar, star, hint, PIN, config, storage, the twenty-four game-rule suites, day 7 recording helpers, album domain/store/adapter, direct-capture rules, ZIP writer, persistent-storage, accessibility helpers, reward/navigation rules and the second-integration UI contract checks |
| `npm run dev` | Manual mobile viewport check (not executed in this session) |
| `npm run verify:pages` | Pages base path, built page and every declared catalog image under `/<repository>/` |

## Risks and deferred work

- **No DOM/component tests:** the domain rules are covered; React interaction, focus restoration, live-region timing and real touch ergonomics are reviewed manually.
- **Error recovery scope:** the boundary catches render-time failures in the React tree. It does not convert an event-handler exception, a storage failure or a browser-media failure into a recovered view; those paths already report their own messages.
- **PIN recovery:** a forgotten PIN needs a storage reset that also erases progress. A recovery flow is future work.
- **PIN strength:** a short numeric PIN plus local storage access is a domestic deterrent, not cryptographic security.
- **Clock trust:** the local device date drives unlocks. Changing the clock bypasses the calendar; acceptable for a family app.
- **Storage durability:** clearing browser data loses PIN, config, child and demo progress, and album media. The album states this and recommends exporting; persistent storage is requested but can still be denied or evicted.
- **Album privacy:** the album is hidden behind the parental PIN in the UI, but the IndexedDB contents are readable by anyone with browser-storage access. It is a household boundary, not encryption.
- **Album export limits:** the ZIP writer is classic ZIP32 and builds the archive in memory. Very large albums fail with a clear message and fall back to individual downloads; there is no ZIP64, compression or streaming.
- **Album capture:** direct photos are implemented, but real-device QA is still pending for permission variants, front/rear switching on phones and laptops, track release after leaving, canvas behaviour on older Safari, and capture at low storage. The checklist lives in `docs/QA_CAMERA_CAPTURE.md`; there is no automated browser-media test runner.
- **Demo/preview store:** both share the isolated demo snapshot. They never touch child progress, but they do share progress with each other by design.
- **Day 7 recording limits:** the clip is temporary until an explicit save succeeds, and the download remains a fallback. The final carol and Trasto overlay remain future work. The UI never claims that a recording was saved before IndexedDB confirms it.
- **Game audio:** day 1 uses visual cues, days 18 and 24 use visual tone labels plus illumination/sway, and the reward dispatches `advent:star-earned` with no listener yet. The reusable audio layer exists, but real tones, music, narration and per-game wiring belong to the next audio-content phase.
- **Visual QA:** the second integration phase changed the mobile header, mission frame, star animation, maze, wooden tiles, bell positions, Copito figure and cipher layout. No browser, emulator or physical-device visual QA was executed; bell-ring alignment, header proportions, text fit at narrow widths, hold gestures and star animation timing remain pending.
- **Bell-ring alignment:** the four stand positions are approximate percentages derived from the 1448×1086 artwork. They need a visual pass on the real image because no browser rendering was available here.
- **Observation pause:** day 21 enforces the fifteen-second observation before rebuilding. Adults can accompany the child, but there is no skip control in this slice.
- **Game UI and media tests:** game rules are covered by pure domain tests; React interaction and the camera/microphone path are verified by type-check, build and manual review because no browser test tool is installed. Album storage is covered through mock IndexedDB factories, not a real browser.
- **Album real-device QA:** opening the database in Safari private mode, quota pressure, very large video imports, preview memory use, ZIP time and download placement still need real-device checks.
- **Album media QA:** no automated browser test exercises object URLs, video playback or download placement.
- **Audio and final art:** recorded narration, licensed music, final effects and the final authorized carol are pending. The definitive WebP artwork is integrated; only Papá Noel for the intelligence crystal and the maze's snowy pine have no final asset and stay documented provisional emoji. The audio infrastructure, preferences, ducking, cleanup and fallback behaviour are implemented; real-device audio QA is tracked in `docs/QA_AUDIO.md`.
- **PWA/offline:** deferred; the app currently needs a network load at least once per session.

## Next step

Phase P13 should execute `docs/QA_CAMERA_CAPTURE.md` and `docs/QA_AUDIO.md` on the family device, then replace the provisional day 7 carol and synthesized audio with authorized recordings, licensed music and the Trasto overlay. Real-device camera/microphone/storage/audio QA and mobile visual QA remain separate deliberate phases. The parental panel, PIN gate, demo isolation, album boundary, capture surface, audio infrastructure and storage-error reporting stay stable.
