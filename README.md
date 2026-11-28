# Los 24 regalos desaparecidos

Interactive Advent calendar for December 2026. Trasto the elf hides one gift per day; each solved mission reveals a clue, and confirming the gift earns a star.

**Current state: final artwork integration.** The definitive WebP artwork extracted from `recursos/Trasto_recursos_web.zip` into `public/assets/final/` is wired through the central catalog. Images are lazy by default, and only the current mission scene or phases request eager loading. A few assets remain provisional because no final art exists (Papá Noel for the intelligence crystal and the snowy pine of the maze), and the day 2 memory pairs reuse existing final character/object art because the folder has no dedicated pair set. The 24-door calendar, the four day states, the star tree, local-date unlocks, persisted progress and a PIN-protected parental panel are in place. Days 1 through 24 run real, touch- and mouse-friendly games that hand success back to the existing hint and gift/star flow. Completed missions can be replayed without changing or duplicating their star. The adult preview keeps a persistent label, returns to the panel and can lock the adult session while leaving to the child calendar. A local parental switch governs the optional camera and recording on day 7 and album capture. Day 7 keeps its provisional karaoke and optional camera/microphone recording, and can save a finished clip to the private album; late camera tracks are stopped if the song ends first. The album stores photos and videos in IndexedDB on the same device, imports from the gallery, can take new photos from the unlocked adult panel, previews, downloads individually, deletes with confirmation and exports a ZIP. A reusable audio layer now provides a central music/voice/effects catalog, gesture-gated playback, local preferences, music ducking under voice, mission cleanup and silent fallback; its music and effects are clearly labelled synthesized placeholders, and voice entries are silent until recorded narration exists. The accessibility and resilience slice adds view-level focus management, milestone-only screen-reader announcements for live counters, accessible symbol/letter descriptions on days 22 and 24, 44 px minimum targets on compact controls and a recovery boundary that returns the family to the calendar without exposing error details. The second integration phase compacts the mobile header and mission frame, adds a wider 9×11 maze with held movement, wooden letter tiles, a hold-to-reveal day 17 gate, bells hung on their stand, a single-phase Copito, the new day 22 words and a single 3-1-5 day 24 conjure cipher, and closes the child reward loop with a persisted star, automatic calendar return and star focus. No new browser or device visual QA was executed in this phase. There is no backend, upload, sync or external service; the final authorized carol remains a future phase. Product requirements live in [`PROJECT_SPECT.md`](./PROJECT_SPECT.md); architecture and scope decisions live in [`docs/TECHNICAL_DECISIONS.md`](./docs/TECHNICAL_DECISIONS.md); artwork integration and audit limits live in [`docs/ASSETS.md`](./docs/ASSETS.md); audio details live in [`docs/AUDIO.md`](./docs/AUDIO.md); real-device capture QA lives in [`docs/QA_CAMERA_CAPTURE.md`](./docs/QA_CAMERA_CAPTURE.md) and audio QA lives in [`docs/QA_AUDIO.md`](./docs/QA_AUDIO.md).

## Quick path

1. `npm install`
2. `npm run dev` — open the printed local URL.
3. `npm run build` — type-check and produce the static build in `dist/`.
4. `npm test` — run the domain, game-rule, PIN, storage, album, capture and ZIP tests with Node's built-in runner.
5. `npm run lint` — run oxlint (the accessibility slice adds no new dependency or test runner).
6. `npm run verify:pages -- <repository>` — build with the GitHub Pages project base and verify that the page and every local asset resolve under `/<repository>/`. Deployment steps live in [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md).

## What this slice delivers

| Area | Delivered |
|------|-----------|
| Calendar | Mobile-first grid of 24 doors with locked, available, mission-complete and gift-found states |
| Date rules | Local December 2026 unlock at local midnight; previous days stay accessible |
| Progress | Final fir artwork as the star tree container, with 24 scalable percentage star positions, one star per day, real pending progress and a full-set celebration |
| Parental access | First-time PIN setup (4–8 digits), session unlock and lock; the PIN is a household barrier, not cryptographic security |
| Adult panel | Edit main hint, location help and hiding spot per day; toggle manual unlock for difficult days; enable or disable the optional camera and recording locally |
| Preview | Open any mission against the isolated demo store without touching child progress; a persistent label identifies it, the back button returns to the panel and the child-calendar exit locks the adult session |
| Demo mode | Activated and exited only from the unlocked adult panel; the child flow never shows or activates it |
| Mission status | The flow branches on `MissionDefinition.status`; all 24 days are `implemented` |
| Day 1 — elf dance | Countdown, the approved 04/08/12/16/20/24/28/32/36/40/44/48 s choreography, statue pause at 32 s, final pose and celebration; restart or repeat; no camera, audio or recording |
| Day 2 — memory | 12 cards, 6 pairs with the definitive card back and Rodolfo, snowman, gift, star, bell and tree art; no timer and no attempt limit |
| Day 3 — red invasion | Manual checklist for two red garments and one red object; no camera or automatic validation |
| Day 4 — reindeer maze | Guide Rodolfo through a wider snowy 9×11 forest with branches and false exits, collect 3 carrots and reach the stable; tap a neighbouring cell, use the large arrows or hold a direction with mouse/touch to repeat one safe step; two definitive walk frames alternate every 175 ms only while moving, Rodolfo always faces the walking direction (the final art faces left, so rightward steps are mirrored), and the carrot/stable use final art; light CSS snow respects reduced motion; no timer |
| Day 5 — snowball fight | Five paper balls per round, three hits to win; an adult marks inside/outside; unlimited new rounds |
| Day 6 — spot the difference | Find the 7 approved changes in the final `taller_A`/`taller_B` images; marking either picture marks both; real normalized hotspots, zone hint and single-image view on small screens |
| Day 7 — silly carol | Final karaoke stage, microphone and singing Trasto, a 72-second provisional lyric, six timed styles and a three-second countdown; finishing always completes without penalty; optional front-camera recording with front/rear selector, live preview, individual download and an explicit save to the private album only after IndexedDB confirms the write; obeys the parental camera switch and stops late tracks after the song ends |
| Day 8 — word scramble | Order the letters of RENO, NIEVE and REGALO with individual wooden tiles, a separate slot row and a tray; a large clue image is the protagonist, feedback marks the solved word and the next one starts automatically after a short pause |
| Day 9 — mismatched socks | Match five sock pairs; a playful 60-second countdown can be extended or restarted and never blocks success |
| Day 10 — ornament patterns | Complete the 5 approved sequences ABABA, ABCAB, AABAA, ABBAB and ABCABCA on the final conveyor belt; star, bell and tree are distinguishable by shape as well as colour, with unlimited retries |
| Day 11 — impossible portrait | Draw a reindeer with eyes closed on the approved 0/5/15/25/35/45/55/65-second script; repeat or extend steps and finish manually |
| Day 12 — gift rain | Move the final basket with finger or mouse, catch 15 red/blue/green/gold gifts, smooth speed ramp, no lives or time limit |
| Day 13 — no laughing | Two 30-second rounds, no tickling, both rounds complete with no mandatory winner |
| Day 14 — maths chest | Discover star = 2 from tree = 5, gift = 3 and reindeer = 4; solve 6, 9 and 5; open the final chest and lock with code 695; illustration-only operations plus a separate value table and progressive help that points back to it |
| Day 15 — elf hands | Guide the 3–2–1 pyramid with socks or mittens, mark the three rows, confirm manually; a playful 60-second timer can be extended or restarted |
| Day 16 — jigsaw | 3×3 final portrait, pieces cut by code with the original 3:2 aspect ratio (no stretching), swap by tap or drag, and a model view at any time |
| Day 17 — silent elf | Three random animals from the exact bank (elephant, cat, dog, lion, monkey, penguin, rabbit, hen, gorilla, duck, frog, reindeer), final images, a face-down card shown only while the actor holds the control (pointer or space/enter) and hidden on release, cancel, outside, focus loss or tab change; the manual hit unlocks only after a show → hide cycle and the next animal is automatic; no revealing audio or camera |
| Day 18 — bell Simon | 4 final bell images as buttons hung on the stand's rings (no checkboxes), 5 cumulative rounds of 2 to 6 notes, replay and retry after a miss; playback, correct and wrong presses add illumination and a short sway without adding sound |
| Day 19 — messy workshop | Find the gift (centre), bell (left shelf), candy cane (behind the green cup), Santa hat (top), blue bauble (top right) and star (above the staircase) in the final scene with zoom, pan and zone help; the six objects are invisible hit areas at real normalized coordinates |
| Day 20 — mystery bag | Instructions, the final opaque sack and three manual hit indicators only; the child surface shows no example-object tips. The family prepares three safe objects privately, the child identifies them by touch without looking, and the sack opens when the mission is complete; no camera |
| Day 21 — absent-minded snowman | Observe Copito's fixed model for 15 s: top hat, carrot nose, red scarf and coal buttons; one large Copito image per phase, preloaded in a stable box and replaced on every correct choice, with no thumbnail history; rebuild through the complete phases `00_base`…`04_botones`, three complete options per phase, a temporary model view that keeps state, no overlays and kind unlimited retries |
| Day 22 — secret elf language | Shared fixed alphabet of exactly 14 symbols including Y = mistletoe, built-in keyboard, decipher LUNA, TRINEO and ESTRELLA without revealing them beforehand; a correct word auto-advances after a short feedback pause |
| Day 23 — surprise for Trasto | Choose the final drawing, letter or craft art, see excited Trasto, confirm manually and see his farewell; no photos, video or camera |
| Day 24 — final mission | Three crystals with stable off/on artwork: intelligence with reindeer = 4, code 64, illustration-only operations and a separate table; memory with 3/4/5 bell sequences on the shared stand and retries; and magic with one nine-symbol cipher grouped 3-1-5, one input/verification, erase controls, the phrase hidden from intro/help and manual pronunciation afterwards; then the prepared/flying sleigh transition, the last hint and a progress/album celebration; no timer |
| Mission integration | The final general frame is the mission hero: it holds the day, title, a brief explanation and the main illustration, with Trasto slightly overlapping the lower edge. A solved game completes the mission below the frame; the existing main hint, optional location help and single gift/star flow continue unchanged. Confirming a gift persists the star first, then shows the reward, dispatches a future-audio event and, for a real child star only, returns to the calendar and focuses/scales the earned tree star. A completed mission can be replayed with a visible repetition notice and no progress write; preview/demo never navigates to the child calendar |
| Game assets | Final WebP artwork resolves through `src/domain/assets.ts` and `resolveAssetPath`, including shared UI, doors, stars, frames, logos, characters, mission illustrations and every final game scene. Images are lazy by default; current mission scenes/phases are eager. Papá Noel (intelligence crystal) and the snowy pine (maze) remain documented provisional emoji because no final asset exists |
| Private album | Parental-only list grouped by mission day and date, multiple photos/videos per day, lazy image/video preview, individual download and confirmed deletion |
| Album import | File-picker import from the gallery for one or many photos/videos, assigned to a chosen mission day; remains the fallback if the camera fails |
| Album capture | Adult-only direct photo: choose a day, front camera by default, rear switch before capture, frozen preview, explicit save after confirmation and cancel/discard without writing; the camera section stays idle and permission-free when the parental switch is off |
| Album export | Dependency-free ZIP32 export with `dia-NN/foto-NN.ext` and `dia-NN/video-NN.ext` names plus `LEEME.txt`; individual download remains available if ZIP limits fail |
| Album durability | Persistent-storage request when available, quota and storage-failure detection, clear data-loss warning and export recommendation |
| Storage errors | PIN setup, config edits, child progress, demo progress, album writes and audio preferences report save failures instead of claiming success |
| Audio | Central music/voice/effects catalog with provisional entries, a manager that only starts or resumes `AudioContext` from user interaction, local channel and volume preferences, music ducking while voice is audible, non-blocking effects, mission-scope cleanup and silent fallback notices |
| Audio controls | Child silence/volume bar plus accessible parental channel toggles, master volume, test tone and stop-all controls; no hints, hiding places or album files |
| Tests | Domain, game-rule, PIN, storage, album domain/store/adapter, capture rules, ZIP, persistent-storage, audio and asset-existence tests, including the day 1 timeline, the day 4 9×11 solvability and held-step safety, the day 7 carol/recording capability and authorized-content seam, the seven day 6 differences, the day 17 reveal gate, the six day 19 hotspots, the single-phase day 21 helper, the fourteen-symbol alphabet with the LUNA/TRINEO/ESTRELLA words, the bell ring positions and press feedback, the one-shot 3-1-5 day 24 conjure, the illustration-only maths contracts, reward persistence/navigation rules and the mobile-layout source contract |

## Game notes

- All twenty-four games work with touch and mouse. None adds a penalty or attempt limit beyond its published mechanic.
- Day 1 shows the approved choreography as visual cues after a three-second countdown. The 32→36 gap keeps the statue cue on screen as the musical pause, and the final 48-second pose leads into a short celebration. The child can restart or repeat the whole dance; no camera, microphone or recording is requested.
- Day 3 uses three large checklist buttons and a manual family confirmation. It never requests the camera and cannot fail.
- Day 4 uses a 9×11 horizontal board with branches and false exits. It accepts taps on a neighbouring cell, the four large direction buttons, or a held direction (mouse, touch or keyboard activation) that repeats one valid step every 160 ms; blocked steps and borders are ignored before any animation, so a held direction can never cross a pine or duplicate a carrot. The final Rodolfo art slides between cells, alternates two walk frames every 175 ms only while moving and always looks in the walking direction: the source art faces left, so rightward steps are mirrored. Light CSS snow and the collection/stable messages respect reduced motion; reaching the stable early only shows how many carrots are missing and no progress is lost.
- Day 5 gives the adult two large "Dentro" and "Fuera" buttons. Three hits win the round; five throws under three hits only show a retry, and a new round always restores the five paper balls.
- Day 6 uses the final `taller_A` and `taller_B` images and seven measured hotspots: bear hat, Trasto's hat tip (bell/pompom), scarf colour, train symbol, Rodolfo's bow, mug and paint pot. Both pictures share one found list, so marking a change in either marks it in both. The zone hint highlights a region, never the exact spot, and a single-image view keeps the comparison usable on small screens.
- Day 7 runs a provisional 72-second lyric after a three-second countdown, with six timed style orders: robot, mouse, giant, sleepy, laugh and pop star. `KARAOKE_CONTENT_CONFIG` is the only seam for an authorized lyric source, instrumental/guide track and timing; it currently declares `authorized: false` and no track, so no new lyric or music was invented. The song ending always completes the mission. Recording is opt-in, defaults to the front camera, offers a front/rear selector before the song, records only the camera/microphone stream (never the karaoke UI), and keeps the mission playable when permissions, the audio mix or MediaRecorder fail. The parental camera switch can hide the whole recording section; no permission is requested in that state. If a `getUserMedia` request resolves after the song ends or the mission leaves, every late track is stopped immediately. After the song, the clip can be previewed and downloaded. The private album appears as an explicit save action; the success message is shown only after the IndexedDB write resolves, and a failure leaves the clip unsaved with the download still available.
- Day 9 starts its playful countdown on the first sock and pauses it on success. At zero the child can keep matching, add 30 seconds or restart at 60; no timer state affects completion.
- Day 10 keeps the approved pattern data separate from the UI. A wrong token is feedback only; the child can retry indefinitely.
- Day 11 follows the approved absolute script at 0, 5, 15, 25, 35, 45, 55 and 65 seconds. Repeating or extending a step changes only the timer, and the finish button is always available.
- Day 12 raises the fall speed and spawn rate by small bounded steps as gifts are caught. Missed gifts are harmless: there are no lives, penalties or time limit.
- Day 13 stops its 30-second round on the timer or the manual button, always counts both rounds and never declares a mandatory winner. Tickling is explicitly excluded.
- Day 14 keeps the approved values and operations as pure data. A separate equivalence table shows each drawing's value; the first aid points the child back to that table and the second asks how much to add to 3 to reach 5. Wrong values, answers and codes are only feedback.
- Day 15 marks the three pyramid rows in order, requires an explicit family confirmation, and keeps the 60-second countdown harmless: at zero the child can keep building, add 30 seconds or restart the timer.
- Day 16 splits the final portrait into nine pieces cut by code; the board keeps the original 3:2 ratio so no piece is stretched. "Ver modelo" shows the finished picture and never changes progress.
- Day 17 uses the exact approved bank of twelve final animal images. Every card is face down by default. Holding the reveal control with a pointer or space/enter shows it; release, cancel, leaving the control, focus loss or hiding the tab closes it again. The manual hit stays disabled until the card was shown and hidden once, then confirmation advances straight to the next hidden animal with a fresh gate. No audio or voice ever reveals the answer.
- Day 18 is intentionally silent until real audio exists: the four final bell images (red, blue, green and gold) are buttons positioned on the final stand's rings with Do/Re/Mi/Fa labels. Playback, a correct press and a wrong press add illumination and a short sway only; replaying shows the sequence again, and no background music plays during a sequence. Day 24 reuses the same stand composition.
- Day 19 uses the final `escena_objetos` scene, which can be zoomed and panned. The six approved objects are invisible hit areas at measured normalized coordinates: gift centre, bell left shelf, candy cane behind the green cup, Santa hat top, blue bauble top right and star above the staircase. No icon or button border reveals them before they are found; the zone help highlights a padded region.
- Day 20 no longer lists safe object examples in the child interface. The family prepares the bag privately; the screen keeps the instructions, the opaque sack and three manual marks, never knows what was placed inside, and allows corrections before continuing.
- Day 21 observes Copito's fixed model for exactly fifteen seconds, then rebuilds it phase by phase through `00_base`…`04_botones`. A single large image shows the current phase and is replaced on each correct choice; all five images are mounted in one stable-ratio box so they preload without layout jumps. There are no thumbnails or history. Each phase offers three complete options; the model can be consulted temporarily without losing state, and a wrong choice is kind feedback with unlimited retries. Nothing is layered into arbitrary combinations.
- Day 22 keeps the fourteen approved symbol-letter associations (including Y = mistletoe) in one domain module, so day 24 can reuse the same table. The three words are LUNA, TRINEO and ESTRELLA; the intro does not list them, the on-screen keyboard only appends up to the current word length, and a correct word auto-advances after a 1.5-second feedback pause with a one-shot guard shared by the manual button.
- Day 23 keeps the three handmade options in one domain list with final drawing/letter/craft art. The child can change the choice until the family confirms it; excited Trasto and the farewell appear without requesting camera, photos or recording.
- Day 24 reuses the day 18 Simon rules and bell stand for three independent 3/4/5-note sequences, and the day 22 alphabet for the single conjure cipher. The intelligence crystal keeps reindeer = 4, code 64 and illustration-only operations with a separate table. The magic cipher shows nine symbols grouped 3-1-5 with visual spaces and one slot per letter; one verification unlocks the manual pronunciation step, and the phrase is not shown in the intro or help before it is solved. The crystals cross-fade between their off and on images in a stable box, and the sleigh cross-fades from prepared to flying. Pronunciation is confirmed by hand, with no microphone or automatic recognition. The sleigh scene uses the final prepared/flying images with a light cross-fade, has no timer, and hands the child to the configured last hint.
- Completing a game only marks the mission as solved. The child still reveals the configured hint and confirms the gift to earn the day's star, exactly as before. The confirmation persists the star before celebrating, guards the button against a double press, dispatches `advent:star-earned` for future audio and, for a real child star only, returns to the calendar after 1.8 s and focuses/scales the earned tree star. Adult preview/demo keeps its isolated progress and never navigates to the child calendar. The reward screen adds a repeat action: the replay runs locally, never calls the completion transition and shows a clear repetition notice, so a day keeps one star and its original timestamps.

## Private album

The album is a parental surface: the calendar, mission panel and footer never render album media or link to the list. An adult opens it from the unlocked panel, where the PIN gate already applies.

| Topic | Behaviour |
|-------|-----------|
| Storage | Photos and videos live in IndexedDB (`los24regalos-album`) on the same device. The metadata store lists the album; the media store keeps the blobs. Nothing is uploaded. |
| Multiple files | Any number of photos and videos per mission day, each with kind, size, creation date and source (`import`, `recording` or `capture`). |
| Import | A file picker accepts `image/*` and `video/*`, one or many files, assigned to a chosen day. Unsupported or empty files are reported per file. It remains the fallback when the camera is unavailable. |
| Camera capture | From the unlocked album, choose a mission day and open the front camera. Switch to the rear camera before capture if needed, review the frozen image, then save explicitly or cancel/discard without writing. Capture never runs in child mode. |
| Preview | Images and videos get a lazy local object URL and standard controls. The URL is revoked when the preview closes. |
| Download | Every memory has an individual download with a sanitized file name. |
| Delete | Deleting asks for inline confirmation and reports success only after IndexedDB resolves. |
| ZIP export | A small in-repository ZIP32 writer stores files without compression. It names entries by day and type (`dia-07/foto-01.jpg`) and adds `LEEME.txt`. It throws a clear limit error instead of producing a broken archive; individual downloads remain available. |
| ZIP limits | 65,535 entries and 4,294,967,295 bytes per file/offset. There is no ZIP64, compression or streaming, and the archive is built in memory. |
| Persistent storage | The album asks `navigator.storage.persist()` when available, shows whether it was granted and displays the browser's usage/quota estimate when it can. A denial is reported, not hidden. |
| Failure reporting | Quota, unavailable, blocked, missing-blob and transaction failures use clear messages. Camera permission denial, missing media APIs, a failed rear switch, canvas/blob failure and empty captures are also reported without blocking gallery import. The UI never says a file was saved or deleted before the operation succeeds. |
| Data loss | The album warns that clearing browser data, uninstalling or storage pressure can erase memories and recommends periodic ZIP exports. Persistent storage is best effort, not a guarantee. |

The ZIP path is verified by unit tests that parse names, contents and CRCs, and by a system `unzip -t` check during this phase. Capture capability, size clamping, file naming and canvas/blob failure codes are covered by unit tests. Real-device QA for permissions, front/rear switching, track release, Safari private mode, quota pressure, very large videos and download placement is still pending; follow [`docs/QA_CAMERA_CAPTURE.md`](./docs/QA_CAMERA_CAPTURE.md).

## Audio

The audio layer is reusable and independent from any single mission. `src/domain/audioCatalog.ts` is the single source of truth for music, voice and effects. Current entries are provisional: music and effects use short synthesized tones, and voice cues are silent placeholders with the text equivalent kept on screen. No third-party audio, network service, backend or dependency was added.

| Topic | Behaviour |
|-------|-----------|
| Activation | `AudioContext` is created or resumed only from a user interaction. A blocked or suspended context shows a clear notice; no game depends on audio to play. |
| Preferences | Music, voice and effects can be toggled independently, one master volume applies, and a child-facing silence button is available. Settings persist under `los24regalos:audio:v1`. |
| Ducking | Music drops to 25% only while a voice is actually audible. A disabled voice channel or muted master never lowers the music. |
| Effects | Fire-and-forget: a failed effect never blocks game logic, and the success/celebration cues run only from explicit completion clicks. |
| Cleanup | Leaving a mission stops its audio scope; the app shell also stops everything on unmount. |
| Fallback | Missing Web Audio, blocked autoplay, corrupt preferences and failed assets all degrade to silence with a short, non-blocking message. |
| Replacement | A final asset changes only its catalog entry to `kind: 'file'` with a `public/`-relative path. Components never build audio paths. |

Automated tests cover the catalog, preference normalization, mixing and ducking math, capability decisions and preference storage. Real-device autoplay, speaker output and voice ducking with a real recording remain pending; follow [`docs/QA_AUDIO.md`](./docs/QA_AUDIO.md) and see [`docs/AUDIO.md`](./docs/AUDIO.md) for the architecture.

## Accessibility and recovery

| Area | Behaviour |
|------|-----------|
| Focus | Opening the calendar, a mission, the preview, the PIN gate, the parental panel or the album moves focus to that surface's heading. Closing returns focus to the door, day summary or album trigger that opened it. |
| Counters | Dance, karaoke and playful timers no longer put every visible second in a live region. A visually hidden polite region announces only meaningful milestones such as 30 s, 10 s, 5 s or zero. |
| Secret alphabet | Days 22 and 24 expose stable Spanish names for the fourteen symbols. The reference table announces each symbol-letter pair; the secret word announces only the symbol names. |
| Touch targets | Critical compact controls use a 44 px minimum: cipher keys, album card actions, camera-facing buttons, link-style navigation and check rows. |
| Recovery | An error boundary wraps the app. A clear recovery screen offers "Volver al calendario" and "Recargar la página", remounts the calendar view and never renders stack traces or internal details. |
| Verification | `test/a11y.test.ts` covers the milestone rule and the 44 px constant; the symbol-cipher suite covers accessible names and descriptions. Real screen-reader and touch QA is still manual. |

## Day 7 limits and pending QA

- The lyric and style instructions are provisional. The final authorized carol, its instrumental base and the music/voice mix are not implemented.
- Recording captures camera and microphone only. A Trasto overlay and the final music mix remain pending; the private album storage is implemented.
- The temporary blob URL lives only while the mission view is open; leaving the mission releases the tracks and revokes the URL. The clip can be saved to the private album or downloaded; saving is never implied without a successful IndexedDB write.
- The parental camera switch is local preference, not a security boundary: turning it off prevents the app from requesting permissions, but it cannot revoke a permission already granted in the browser settings.
- Real-device QA is still pending: front/rear camera switching, camera-only and microphone-only permission failures, audio-mix failure, MediaRecorder MIME negotiation on WebM and Safari MP4, long-recording behaviour, low storage, background/foreground changes, track release after leaving and a slow permission request finishing after the song.
- Automated tests cover the pure carol timeline, MIME negotiation, camera constraints, recording capability and the album save contract. There is still no DOM, browser-media or component test runner; album storage is tested with in-memory and mock IndexedDB factories.

## Non-goals in this slice

- Album video capture from the panel; day 7 keeps its own opt-in recording flow.
- The final authorized carol, instrumental base and Trasto overlay in recordings.
- ZIP64, compression, streaming export or cloud backup.
- Media encryption at rest and multi-user album accounts.
- Final recorded narration and licensed music. The audio infrastructure exists, but voice entries are silent placeholders and music/effects are synthesized provisional tones.
- Service worker, manifest or any offline/PWA behaviour.
- Backend, sync or external services.

## Security boundary

The PIN keeps a child out of the configuration panel and the album on a shared family device. It does not protect secrets from an adult with browser-storage access: the stored PBKDF2 record can be replaced or removed, and the IndexedDB album contents are not encrypted. Demo and preview are adult surfaces reachable only after unlocking; future-day hints, hiding spots and album media are never rendered in the child flow. The parental camera switch is a local preference that stops new media permission requests; the preview exit that returns to the child calendar also locks the adult session.

## Layout

```
src/
  components/  calendar grid, star tree, mission panel, adult gate/panel,
               private album panel/card, adult camera capture and game slot
    games/     day 1 elf dance, day 2 memory, day 3 red checklist, day 4
               reindeer maze, day 5 snowball fight, day 6 spot the difference,
               day 7 karaoke recording, day 8 word scramble, day 9 sock pairs,
               day 10 patterns, day 11 guided drawing, day 12 gift rain, day 13
               no laughing, day 14 maths chest, day 15 pyramid, day 16 jigsaw,
               day 17 charades, day 18 bell Simon, day 19 hidden objects, day 20
               mystery bag, day 21 snowman, day 22 symbol cipher, day 23 craft
               surprise, day 24 final mission with its three crystal components
  domain/      types, missions, assets, progress, calendar, config, album,
               shared camera constraints and album capture rules
    games/     pure rules, timers and shared shuffle for the implemented
               missions, including the day 1 dance timeline, the day 7 carol
               timeline and recording negotiation, and the day 24
               intelligence, memory, magic and crystal orchestration modules
  audio/       gesture-gated Web Audio manager, React snapshot hook and the
               mission audio scope that stops audio on unmount
  security/    local parental PIN helper
  storage/     versioned localStorage adapters (including audio preferences),
               IndexedDB album database/store, album error mapping,
               persistent-storage helpers and ZIP writer
  App.tsx      calendar/mission/adult album shell, PIN session and persistence wiring
test/          Node built-in tests compiled by tsconfig.test.json
docs/          technical decisions, the deployment guide, the audio design note
               and the real-device camera and audio QA checklists
scripts/       local GitHub Pages build verification (Node built-ins only)
public/        static files served as-is, including the final WebP artwork under assets/final/ and the documented SVG fallback
.github/       GitHub Actions workflow that builds dist/ and deploys it to Pages
```

## Next step

Phase P13: execute [`docs/QA_CAMERA_CAPTURE.md`](./docs/QA_CAMERA_CAPTURE.md) and [`docs/QA_AUDIO.md`](./docs/QA_AUDIO.md) on the family device, then replace the provisional carol and synthesized audio with authorized recordings, licensed music and the Trasto overlay. Real-device camera/microphone/storage/audio QA and mobile visual QA remain separate deliberate phases. This session ran `npm run lint`, `npm test`, `npm run build` and `npm run verify:pages`, but did not run a browser, emulator or physical-device visual review; the mobile header, mission frame, star animation, bell-ring alignment, maze feel and hold gestures still need that manual QA. The only missing final graphics remain Papá Noel for the intelligence crystal and the maze's snowy pine.
