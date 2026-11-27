# Audio system: catalog, manager and preferences

The app now has a reusable audio layer for music, voice and effects. It ships without final audio: music and effects use clearly labelled synthesized placeholders, and voice entries stay silent until a recorded narration exists. No third-party music, network service, backend or dependency was added, and no game depends on audio to be playable.

## Quick path

1. Open the child calendar: the new audio bar offers one silence button and one volume slider.
2. Unlock the parental panel: the **Sonido** section exposes music, voice and effects toggles, master volume, a test tone and a stop button.
3. Change a preference: it is saved under `los24regalos:audio:v1` and applied immediately.
4. Leave a mission: the mission scope stops any audio it started.
5. Replace a provisional entry: edit `src/domain/audioCatalog.ts`, not a component.

## Architecture

| File | Responsibility |
|------|----------------|
| `src/domain/audioCatalog.ts` | Central catalog for music, voice and effects. Pure data, no Web Audio or DOM |
| `src/domain/audioPreferences.ts` | Preference shape, defensive normalization, capability probe and the pure `resolveAudioMix` gain rules |
| `src/storage/audioPreferences.ts` | Versioned `localStorage` snapshot for device preferences |
| `src/audio/audioManager.ts` | The only Web Audio adapter: context lifecycle, playback, ducking, scopes, cleanup and fallback messages |
| `src/audio/useAudioSnapshot.ts` | React subscription to manager status and notices |
| `src/audio/MissionAudioScope.tsx` | Stops mission-scoped audio when a mission view unmounts or changes day |
| `src/components/ChildAudioBar.tsx` | Child-facing silence and volume controls |
| `src/components/AudioSettingsSection.tsx` | Accessible parental channel, volume and test controls |
| `test/audio.test.ts` | Catalog, preference, mixing, capability and storage tests |

## Catalog

`AUDIO_CATALOG` owns every cue. Entries use one of three shapes:

| Shape | Use | Current examples |
|-------|-----|------------------|
| `tones` | Provisional synthesized music and effects | `music.ambient`, `music.celebration`, `effect.bell.do`…`fa`, `effect.success`, `effect.celebration`, `effect.ui.tap` |
| `file` | Future licensed recording or music, loaded from `public/` | None yet; the shape is implemented and tested by contract |
| `silent` | Placeholder where a recorded human voice will go | `voice.trasto.welcome`, `voice.trasto.celebrate` |

Rules:

- Every current entry is `provisional: true`.
- Ids keep their channel prefix: `music.*`, `voice.*`, `effect.*`.
- A silent voice entry keeps the text equivalent on screen; it never pretends to narrate.
- Provisional tones validate the pipeline. They must not be presented as final music or as a replacement for a licensed recording.

### Replacing a provisional entry

Change only the catalog entry:

```ts
'voice.trasto.welcome': {
  kind: 'file',
  channel: 'voice',
  provisional: false,
  label: 'Trasto welcome narration',
  src: 'assets/audio/final/voice/trasto-welcome.mp3',
},
```

The manager resolves the path through Vite's base URL, loads it on first use, caches the decoded buffer, and keeps the game silent with a clear notice if the file fails. Components never build audio paths themselves.

## Manager lifecycle

| Rule | Behaviour |
|------|-----------|
| User gesture first | `AudioContext` is created only from `unlock()` or a playback call made inside a click, tap or key press |
| Autoplay policy | A suspended context is resumed on the next interaction; a blocked context reports a message instead of throwing into the UI |
| Unsupported browser | A missing `AudioContext` marks audio `unsupported`; every mission stays playable |
| Effects | Fire-and-forget: callers never await playback, and a failed effect cannot block game logic |
| Music | One cue at a time; starting another replaces it, and a looping tone pattern is stopped by its handle |
| Voice | Voice playback marks a source as active, so the music channel ducks |
| Ducking | Music drops to `MUSIC_DUCKING_GAIN` (0.25) only while a voice is audible; a disabled voice channel or muted master never ducks music |
| Scopes | `enterScope` / `exitScope` associate audio with a mission; leaving stops only that scope |
| Cleanup | `MissionAudioScope` stops mission audio on unmount; the app shell calls `stopAll` on unmount; `dispose` closes the context |
| Asset failure | Missing, blocked or undecodable files keep playback silent and emit a clear, non-blocking message |

## Preferences and mixing

Preferences are device settings, separate from mission progress:

```ts
interface AudioPreferences {
  muted: boolean      // child silence control
  music: boolean
  voice: boolean
  effects: boolean
  volume: number      // 0–1, rounded to two decimals
}
```

`resolveAudioMix` is the single source of truth. The manager applies its three results to three gain nodes, so these paths cannot disagree:

- master mute;
- per-channel enable/disable;
- master volume;
- voice ducking;
- a corrupt stored snapshot (normalized back to defaults).

## UI surfaces

| Surface | Controls | Boundary |
|---------|----------|----------|
| Child audio bar | One silence button, one volume slider, short status note if audio is unavailable | No hints, hiding places, album files or channel internals |
| Parental **Sonido** section | Music, voice, effects, silence, volume, test tone, stop all | Behind the existing PIN; never exposes album media |
| Mission | Optional success and celebration effects on explicit completion clicks | Game rules and success conditions are unchanged |

## Failure modes

| Failure | User-visible result | Game impact |
|---------|---------------------|-------------|
| No Web Audio API | “Este navegador no puede reproducir audio…” in the audio controls | None; every mission remains playable |
| Autoplay blocked | A message asks for a sound-button interaction | None |
| Context suspended later | A message asks for another interaction | None |
| Audio file missing or blocked | A short notice says the activity continues in silence | None |
| Voice placeholder | Silent by design; text equivalent stays on screen | None |
| Preference save rejected | The parental section warns that settings apply only for the session | None |

## Tests and verification

`npm test` covers:

- catalog channel coverage, provisional entries, id prefixes, tone bounds and silent-entry notes;
- preference defaults, corrupt input, volume clamping and rounding;
- every mixing path: mute, channel toggles, volume, ducking and “disabled voice must not duck”;
- capability decisions for unsupported, gesture-gated and already-running contexts;
- preference storage round-trip, unknown schema, corrupt JSON and save failure.

Not covered by automation: real browser autoplay policy, real decoded files, actual speaker output and device-specific suspension. Those checks live in [`QA_AUDIO.md`](./QA_AUDIO.md).

## Pending limits

- Voice cues are silent placeholders; recorded narration is still pending.
- Music cues are synthesized placeholders; the final licensed music and authorized carol are still pending.
- No background music starts automatically. The app exposes the manager and cues, but the final mixing decision per mission belongs to the audio-content phase.
- Game components were not modified. The only playback wired in this slice is the app-level success and celebration effects on explicit completion clicks.
- Real-device audio QA is pending.

## Checklist

- [x] Central music, voice and effects catalog with provisional entries.
- [x] Context created or resumed only from a user interaction.
- [x] Local music, voice, effects and volume preferences.
- [x] Music attenuation while a voice is audible.
- [x] Non-blocking effects.
- [x] Mission-scope cleanup on exit and app cleanup on unmount.
- [x] Silent fallback with a clear notice for browser, autoplay and asset failures.
- [x] Accessible parental controls and a simple child silence/volume surface.
- [x] Domain, capability and storage tests.
- [ ] Recorded narration, licensed music and real-device QA.
