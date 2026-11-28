# Definitive artwork — integration and verification

The definitive WebP set extracted from `recursos/Trasto_recursos_web.zip` into `public/assets/final/` is now the app artwork. `src/domain/assets.ts` is the only catalog, `resolveAssetPath` applies the Vite base path, and `AssetGlyph` keeps images lazy unless a mission scene or phase is already on screen. `recursos/` and the source ZIP stay git-ignored and were not modified.

## Quick path

1. Read `Loading strategy` before adding a new image reference.
2. Run `npm test` and `npm run verify:pages` after changing the catalog.
3. Use `docs/TECHNICAL_DECISIONS.md` for architecture decisions and this file for the artwork audit snapshot.

## Loading strategy

| Rule | Implementation |
|------|----------------|
| Single source | Every path lives in `src/domain/assets.ts`; components never build media URLs. |
| Base path | `resolveAssetPath` prefixes Vite's `BASE_URL`, so GitHub Pages sub-paths work. |
| Lazy by default | `AssetGlyph` renders `loading="lazy"` and `decoding="async"`. |
| Eager only when needed | The header logo, the calendar/mission banners, a current mission scene and the five day 21 phase images pass `priority`, which sets `loading="eager"` and `fetchPriority="high"`. The five phase files are small and belong to the open mission. |
| No whole-folder preload | The 120-file / 41 MB folder is never requested on first paint; shared icons and doors stream in as they render. |
| Shell final art | The header logo, page backdrop, calendar banner, both door states, star tree, mission hero frame and album book render from final images at full strength; only small UI cue glyphs stay at glyph size. |
| Mission hero | `00_comunes/interfaz/marco_general.webp` is the mission hero container, not an empty banner: it holds the day, title, brief and main illustration, and Trasto overlaps its lower edge. It keeps the 3:2 source ratio. |
| Star tree overlay | `00_comunes/interfaz/arbol_estrellas.webp` is a relative 2:3 container. `src/domain/starTreeLayout.ts` places 24 star images at percentage centres, so the layout scales on mobile and desktop; there is no separate horizontal row. Day 24 owns the tip position and uses a larger percentage size. Each star stacks the off and on final images so the reward can cross-fade and pop. |
| Wooden letters | Day 8 no longer stretches `game.word.board` as a background. Each letter and slot is an individual CSS wooden tile; the clue image is the protagonist. |
| Copito phases | Day 21 mounts the five complete phase images in one 490:462 box and shows only the active one, so the images preload without layout jumps and no thumbnail history is rendered. |
| Honest fallback | Only entries without a final asset stay emoji with `provisional: true`. |

## Verification performed

| Check | Command / method | Result |
|-------|------------------|--------|
| Catalog file existence | `npm test` → `test/assets.test.ts` | Every `kind: 'image'` entry resolves to a non-empty file under `public/`. |
| Primary shell references | `npm test` → `test/shellAssets.test.ts` | The header logo, backdrop, calendar banner, door states, star tree, mission banner and album book reference non-provisional final images, and no faint frame layer hides them. |
| Built output and Pages base | `npm run verify:pages` | 119 URLs served; 115 catalog images present in `dist/` and resolved under `/calendario_adviento/`; the production bundle still references the 11 primary shell artwork filenames. |
| Format and dimensions | `file` + `ffprobe` on every final file | 120 final files: 111 with alpha (`yuva420p`/`argb`), 9 without alpha (`yuv420p`). No missing or zero-byte catalog files. |
| Hotspot alignment, day 6 | Cropped each measured rectangle from `taller_A` and `taller_B` with `ffmpeg`, reviewed side by side | The seven regions contain the intended change in both images. |
| Hotspot alignment, day 19 | Cropped each measured rectangle from `escena_objetos` | The six regions contain the gift, bell, candy cane, Santa hat, blue bauble and star. |
| Aspect ratios | CSS review + image metadata | Day 6 scene is 3:4, day 19 scene is 1672:941, day 16 board is 3:2, day 24 sleigh is 2:1, crystals are square; no stretched container. |
| Star overlay alignment | The previous composited check was made before the second integration phase reversed the layout so day 24 owns the tip and is larger. The new percentages were checked by unit tests for bounds and uniqueness only. | Visual re-compositing over the artwork is still pending; do not treat the new star overlay as visually verified. |
| Bell ring positions | Percentages approximating the four hooks on `18_campanas/soporte.webp` (1448×1086) | Static only. Real alignment on the artwork and at each viewport is still pending. |

## Key artwork dimensions

| Surface | Asset | Dimensions |
|---------|-------|------------|
| Day 6 scenes | `06_diferencias/taller_A.webp`, `taller_B.webp` | 768×1024 |
| Day 16 puzzle | `16_cuadro_roto/puzzle_trasto_rodolfo.webp` | 1536×1024 |
| Day 19 scene | `19_taller_desordenado/escena_objetos.webp` | 1672×941 |
| Day 21 phases | `21_muneco/fases/00_base…04_botones.webp` | 490×462 |
| Day 24 crystals | `24_final/cristal_*_off/on.webp` | 1254×1254 |
| Day 24 sleigh | `24_final/trineo_preparado/volando.webp` | 1774×887 |
| Mission hero frame | `00_comunes/interfaz/marco_general.webp` | 1536×1024 |
| Star tree | `00_comunes/interfaz/arbol_estrellas.webp` | 1024×1536 |
| Star states | `00_comunes/interfaz/estrella_apagada.webp`, `estrella_encendida.webp` | 1254×1254 |
| Characters | `00_comunes/personajes/*.webp` | 1024×1536, 1312×1199, 1199×1312 or 1024×1536 |
| Bells and stand | `18_campanas/*.webp` | 1254×1254; stand 1448×1086 |

## Provisional placeholders that remain

These entries intentionally stay emoji because the final folder has no matching asset. They keep the mission playable and are not presented as final art.

| Area | Entry | Reason |
|------|-------|--------|
| Final intelligence crystal | `game.final.santa` | No definitive Papá Noel asset in the folder. |
| Reindeer maze | `game.maze.tree` | No snowy-pine asset; only the decorated star tree exists. |
| System/UI actions | Album photo/video/import/export icons | No final action icons; functional emoji remain. |
| Game cue glyphs | Dance moves, snowball hit/miss, sock colour variants, no-laugh faces, pyramid cup/clock, touch-hand/hit, karaoke style icons | No per-cue final artwork. The touch spoon/ball/sponge example assets are no longer rendered after day 20 removed the child-facing safe-object list. |
| Day 9 socks | Five colour variants | Only one final sock object exists, so the colour pairs remain emoji to stay distinguishable. |

The day 2 memory pairs are not provisional: they reuse existing final Rodolfo, snowman, gift, star, bell and tree art because the folder has no dedicated pair set.

## Unused final files

The background town/workshop images are now rendered: the child calendar uses the town pair and the mission surfaces use the workshop pair, each with a wide and a portrait variant. The ornate frames are rendered at full strength: the calendar frame as a banner and the general frame as the mission hero container, not near-invisible background layers. These five remaining files are optional UI or physical-print material, not missing dependencies:

- `00_comunes/interfaz/boton_rojo.webp`
- `00_comunes/interfaz/boton_verde.webp`
- `00_comunes/interfaz/cartel_madera.webp`
- `25_despedida_fisica/plantilla_carta.webp`
- `25_despedida_fisica/plantilla_diploma.webp`

## Limits of this verification

- No browser, mobile device or screen-reader visual QA was executed. Chromium/Playwright is not installed in this environment, so the review is static: metadata, crops, CSS reasoning, type-check, build and served-asset checks.
- Hotspot rectangles were measured and visually confirmed against the final images, but they were not validated by tapping on a real touch device.
- Pixel-perfect rendering, contrast, font metrics and per-viewport cropping remain manual QA items.
- The second integration phase changed mobile header proportions, the star overlay, bell ring placement, the wooden-tile look, the single Copito figure and the 3-1-5 cipher groups. None of those changes was checked in a browser or on a device; no new screenshots, images or audio were generated.
- The source ZIP and `recursos/` folder were not opened, changed or copied; only the already-extracted `public/assets/final/` files were used.

## Checklist

- [x] Every declared image exists under `public/` and in `dist/`.
- [x] The Pages base path resolves every catalog image.
- [x] Day 6 and day 19 hotspots were inspected against the real artwork.
- [x] Aspect-ratio-sensitive surfaces keep their original ratio.
- [ ] Real-device touch and mobile visual QA.
- [ ] Visual re-check of the new star overlay and bell ring positions.
- [ ] Final Papá Noel and snowy-pine artwork.
