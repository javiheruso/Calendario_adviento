# Real-device QA — direct photo capture in the private album

**Status: pending real-device execution for the current delivery.** The automated suite covers the capture rules and storage contract; it does not exercise a real camera, browser permission UI, canvas encoding or device track indicators.

This checklist verifies the adult-only capture flow added to the private album: choose a day, open the front camera, switch to the rear camera before capture, review the frozen photo, save only after explicit confirmation, cancel or discard without saving, and recover from permission, API, canvas, blob and storage failures.

## Quick path

1. Run `npm run dev` and open the app through `localhost` or HTTPS.
2. Unlock the parental panel and open the private album.
3. Execute the tests in the matrix below on the family phone and on a second browser if available.
4. Record the exact device, OS, browser version and result for each test.
5. Do not mark the release ready until the permission, switch, cancel and track-release rows pass.

## Preconditions

| Item | Requirement |
|------|-------------|
| App | Built or dev build served from `localhost` or HTTPS; camera APIs require a secure context |
| Adult access | A configured PIN and an unlocked parental panel |
| Parental camera switch | Both states must be tested: enabled (default) and disabled from "Cámara y grabación opcional" |
| Child access | The normal child calendar without unlocking the panel |
| Storage | Enough free space for a few photos; a second run can simulate low storage |
| Network | Online only for the first load; capture and save must work offline afterwards |

## Test matrix

| ID | Scenario | Steps | Expected result |
|----|----------|-------|-----------------|
| C1 | Child mode never exposes the camera | Open the child calendar and any mission without unlocking the panel. Watch for a camera permission prompt and inspect the DOM for capture controls | No prompt, no camera preview, no capture button and no album media |
| C2 | Front camera is the default | Unlock the panel, open the album, choose a day and press "Abrir cámara frontal" | The browser asks for camera permission; the front camera opens when available; the Frontal button is active |
| C3 | Allow permission and capture | Grant permission, wait for the live preview, press "Hacer foto" | The preview freezes on the captured image; the live camera stops; no record exists yet |
| C4 | Explicit save | After C3 press "Guardar en el álbum privado" | A success message appears only after the write; the new card lists the chosen day and "Foto hecha con la cámara"; reload still shows it |
| C5 | Cancel without saving | Open the camera, then press "Cancelar sin guardar" before or after capturing | The section closes, no new album record appears and the camera indicator turns off |
| C6 | Discard and repeat | Capture a photo, press "Descartar y repetir" | No record is written; the live camera reopens and a new shot can be taken |
| C7 | Switch to the rear camera | With the live preview open press "Trasera" | The preview switches to the rear camera; the previous stream stops; the button state updates |
| C8 | Switch failure | On a one-camera device or after blocking the rear camera, press "Trasera" | A clear notice explains the failure; the section stays usable; retry and gallery import remain available |
| C9 | Camera permission denied | Block camera permission for the site, then press "Abrir cámara frontal" | A clear permission notice appears; no crash; the import section still works |
| C10 | Camera missing or busy | Use a device without a camera, or open the camera in another app, then retry capture | A clear unavailable/busy notice appears; import remains available |
| C11 | No media APIs | Open the app in a browser context without `getUserMedia` or canvas `toBlob` if available | A clear capability notice appears; the import section remains usable |
| C12 | Canvas/blob failure | In DevTools override `HTMLCanvasElement.prototype.toBlob` to return `null`, throw, or call back with an empty blob; capture | The app shows the matching capture notice, keeps the live camera for retry and writes nothing |
| C13 | Empty frame | Press "Hacer foto" before the preview has dimensions | A "not ready" notice appears; no record is written |
| C14 | Save quota or blocked storage | Fill device storage or simulate an IndexedDB failure; capture and save | The UI shows the storage warning, never claims success, keeps the shot for retry and leaves gallery import available |
| C15 | Track release on close | With the live preview open, press "Cancelar sin guardar", then "Volver al panel familiar" | The camera indicator turns off immediately; no stream remains |
| C16 | Track release on lock or reload | With the live preview open, press "Bloquear panel" and reload the page | The camera indicator turns off; no permission prompt remains active |
| C17 | Track release on switch | With the live preview open, alternate Frontal and Trasera several times | At most one stream is active; no stalled preview or duplicate camera indicator |
| C18 | Local-only privacy | With DevTools Network open, capture and save | No image request or upload appears; the record exists only in IndexedDB |
| C19 | Offline capture | Load the app once, enable DevTools offline, then capture and save | Capture and save still work because they are local |
| C20 | Mobile layout and touch | Repeat C2–C6 on a phone in portrait and landscape | Buttons remain reachable, the preview is readable and no control is clipped |
| C21 | Parental switch off for album capture | In the adult panel disable "Permitir cámara y grabación opcional", then open the album capture section | A clear disabled notice appears; no permission prompt is shown; the capture form is absent; gallery import still works |
| C22 | Parental switch off for day 7 | With the switch off, open day 7 in preview or child mode and start the song | No camera checkbox, preview or permission prompt appears; the song and mission complete normally |
| C23 | Late camera request after song exit | Throttle CPU or add latency to `getUserMedia`, enable recording, start the song, then let the song finish or leave the mission before permission resolves | The camera indicator never stays on; any late stream tracks stop immediately; no preview attaches to the finished session |

## Evidence template

Copy this block per device and attach it to the phase report:

```text
Device:
OS and version:
Browser and version:
Secure context (localhost/HTTPS):
Tests executed: C1–C23
Result per test:
Failures and console errors:
Screenshots or recordings (optional):
Camera indicator after cancel/close (off/on):
Storage state after save (record visible after reload yes/no):
```

## Automated coverage already in place

`npm test` covers the deterministic parts:

- capability resolution for missing `getUserMedia` and missing canvas `toBlob`;
- aspect-ratio clamping to 1600 px without upscaling;
- timestamped, day-first file names;
- canvas/blob orchestration including not-ready, missing canvas, draw failure, null or throwing `toBlob`, and empty-blob codes;
- `capture` source acceptance in the IndexedDB adapter;
- album store save contract, quota mapping and existing import/export/deletion behaviour;
- the parental camera preference default, toggle and persistence, including old snapshots.

It does not cover real permissions, device switching, actual JPEG encoding, camera indicator behaviour, object URL rendering or storage-pressure failures. Those are the purpose of this checklist.

## Next step

Run the matrix on the family device, record the evidence, and fix any failure before the release. If a browser cannot support capture, keep gallery import as the documented fallback and report the limitation instead of hiding it.
