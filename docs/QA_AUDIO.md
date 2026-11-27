# Real-device QA — audio system

**Status: pending real-device execution for this delivery.** The automated suite covers the catalog, preference rules, mixing math, capability decisions and storage contract. It does not exercise a real `AudioContext`, browser autoplay policy, speaker output, decoded files or device suspension.

This checklist verifies the reusable audio layer: user-gesture activation, music/voice/effects preferences, volume, music ducking while a voice is active, non-blocking effects, mission cleanup and silent recovery from browser or asset failures.

## Quick path

1. Run `npm run dev` and open the app through `localhost` or HTTPS.
2. On the child calendar, use the audio bar once with the speakers at a safe volume.
3. Unlock the parental panel and open **Sonido**.
4. Execute the matrix on the family phone and on a second browser if available.
5. Record device, OS, browser version and result per test.
6. Do not mark audio ready until autoplay, fallback, cleanup and preference persistence pass.

## Preconditions

| Item | Requirement |
|------|-------------|
| App | Dev or built app served from `localhost` or HTTPS |
| Speakers | Device volume audible but comfortable; headphones optional |
| Adult access | A configured PIN and an unlocked parental panel |
| Child access | The normal child calendar without unlocking the panel |
| Network | Online only for the first load; no audio request may leave the device |

## Test matrix

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| A1 | No audio before a gesture | Load the app, stay on the calendar and watch the browser/devtools audio state | No `AudioContext` starts, no autoplay warning, no sound |
| A2 | First child interaction | Press the child silence button or move the volume slider | The context starts or resumes; the child bar shows no blocking error |
| A3 | Child silence | Press the child silence button twice | Sound stops immediately and returns without reloading |
| A4 | Child volume | Drag the child volume slider from 0 to 100 | Volume follows the slider; 0 silences; the percentage stays readable |
| A5 | Adult channel toggles | In **Sonido**, disable Music, then Voice, then Effects, testing the test tone where relevant | Each toggle affects only its channel; the test tone respects the effects toggle and master volume |
| A6 | Master mute | Enable «Silenciar todo» in the parental section | Every channel is silent even with channel boxes checked |
| A7 | Preference persistence | Change channels and volume, reload the app, reopen **Sonido** | The same values remain; a failed save shows a warning instead of a false success |
| A8 | Test tone | Press «Probar sonido» | A short provisional success chime plays after the interaction; no mission state changes |
| A9 | Stop all | Play the test tone or a mission effect, then press «Detener todo el audio» | Audio stops; controls remain usable |
| A10 | Non-blocking effect | Complete a mission and confirm the gift | Success/celebration effects play when available; the mission, hint and star flow complete even if audio fails |
| A11 | Mission cleanup | Start a mission, trigger an effect, then press «Volver al calendario» | No mission audio continues after leaving; the next mission starts with a clean scope |
| A12 | Day change cleanup | From an adult preview, move between two missions | The previous mission scope stops; no overlapping success/celebration sound |
| A13 | Autoplay blocked | Block sound for the site or use a browser profile that blocks autoplay, then open the app | A clear non-blocking message asks for a sound interaction; every game remains playable |
| A14 | No Web Audio API | Use a browser context without `AudioContext` if available, or stub it out in DevTools | The audio controls report that sound is unavailable; missions remain playable |
| A15 | Missing or blocked asset | Add a temporary `file` entry or block a local audio request in DevTools, then trigger it | Playback stays silent, a clear notice appears, and the game is not blocked |
| A16 | Corrupt preferences | In DevTools, set `los24regalos:audio:v1` to invalid JSON or an unknown schema, then reload | Safe defaults return; no crash and no unexpected mute |
| A17 | Voice ducking | Once a real voice asset exists, start music and a voice cue at the same time | Music drops while the voice is audible and returns when it ends; disabling the voice channel does not duck music |
| A18 | Accessibility | Use keyboard only and a screen reader on the child bar, parental section and test buttons | Every control is reachable, labelled and announced; focus is visible |
| A19 | Small screen | Repeat A2–A5 on a phone in portrait and landscape | Controls stay reachable and readable; no horizontal clipping |
| A20 | Local-only privacy | With DevTools Network open, use every control | No upload, telemetry or third-party audio request appears |

## Evidence template

Copy this block per device and attach it to the phase report:

```text
Device:
OS and version:
Browser and version:
Secure context (localhost/HTTPS):
Tests executed: A1–A20
Result per test:
Failures and console errors:
AudioContext state after first gesture:
Preference values after reload:
Mission audio after leaving (none/lingering):
Voice ducking result (pass/pending voice asset):
Screenshots or recordings (optional):
```

## Automated coverage already in place

`npm test` covers:

- catalog coverage for music, voice and effects;
- provisional flags, id prefixes, tone bounds and silent notes;
- default, corrupt and out-of-range preferences;
- volume clamping and rounding;
- mute, channel toggles, volume, ducking and the “disabled voice must not duck” rule;
- unsupported, gesture-gated and already-running capability decisions;
- storage round-trip, unknown schema, corrupt JSON and save failure.

It does not cover real autoplay policy, decoded assets, speaker output, device suspension or screen-reader announcements. Those are the purpose of this checklist.

## Next step

Run the matrix on the family device once the first recorded voice asset exists, record the evidence, and fix any failure before treating audio as release-ready. Keep the synthesized placeholders clearly labelled until licensed music and narration replace them.
