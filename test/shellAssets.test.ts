import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ASSET_CATALOG } from '../src/domain/assets'

const PROJECT_ROOT = resolve(__dirname, '../../..')
const SRC_ROOT = resolve(PROJECT_ROOT, 'src')
const PUBLIC_ROOT = resolve(PROJECT_ROOT, 'public')
const CSS_PATH = resolve(SRC_ROOT, 'index.css')

/**
 * Final artwork the primary shell must keep rendering. These are the surfaces
 * the family sees on the child calendar and the mission flow, so a missing
 * reference means the published UI silently falls back to a provisional look
 * even though the files still exist under `public/`.
 */
const REQUIRED_SHELL_ASSETS: Readonly<Record<string, readonly string[]>> = {
  'App.tsx': [
    'ui.logo.characters',
    'ui.background.town.horizontal',
    'ui.background.town.vertical',
    'ui.background.workshop.horizontal',
    'ui.background.workshop.vertical',
  ],
  'components/CalendarGrid.tsx': [
    'ui.frame.calendar',
    'ui.door.closed',
    'ui.door.open',
  ],
  'components/MissionPanel.tsx': ['ui.frame.general', 'brand.trasto.explains'],
  'components/StarTree.tsx': ['ui.tree', 'ui.star', 'ui.star.off'],
  'components/AlbumPanel.tsx': ['album.book'],
}

function readSource(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf8')
}

/** Collects only the literal `getAsset('id')` calls in a component source. */
function literalAssetReferences(source: string): string[] {
  return [...source.matchAll(/getAsset\(\s*'([^']+)'\s*\)/g)].map((match) => match[1])
}

function requireFinalImage(id: string): void {
  const asset = ASSET_CATALOG[id as keyof typeof ASSET_CATALOG]

  assert.ok(asset, `${id} must exist in the asset catalog`)
  assert.equal(asset.kind, 'image', `${id} must point at final artwork, not emoji`)

  if (asset.kind !== 'image') {
    return
  }

  assert.equal(asset.provisional, false, `${id} must not be marked provisional`)
  assert.ok(
    existsSync(resolve(PUBLIC_ROOT, asset.src)),
    `${id} must resolve to public/${asset.src}`,
  )
}

/** Returns the declaration block for a single-class selector, or an empty string. */
function ruleBody(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)

  if (start === -1) {
    return ''
  }

  return css.slice(start, css.indexOf('}', start))
}

test('the primary shell references the final artwork', () => {
  for (const [file, requiredIds] of Object.entries(REQUIRED_SHELL_ASSETS)) {
    const source = readSource(file)

    for (const id of requiredIds) {
      // The id must be an exact quoted catalog key in the component. This also
      // catches ids passed through a typed `AssetId` variable (backdrops).
      assert.ok(
        source.includes(`'${id}'`),
        `${file} must reference the final asset '${id}' on the primary shell`,
      )
      requireFinalImage(id)
    }
  }
})

test('every literal shell asset reference resolves to an existing file', () => {
  for (const file of Object.keys(REQUIRED_SHELL_ASSETS)) {
    for (const id of literalAssetReferences(readSource(file))) {
      const asset = ASSET_CATALOG[id as keyof typeof ASSET_CATALOG]

      assert.ok(asset, `${file} references unknown asset ${id}`)

      if (asset.kind === 'image') {
        assert.ok(
          existsSync(resolve(PUBLIC_ROOT, asset.src)),
          `${file} -> ${id} is missing public/${asset.src}`,
        )
      }
    }
  }
})

test('the shell artwork is visible instead of hidden by faint CSS layers', () => {
  const css = readFileSync(CSS_PATH, 'utf8')

  for (const selector of [
    '.app__backdrop-img',
    '.app__logo-image',
    '.calendar__banner-image',
    '.door__art',
    '.tree__scene-image',
    '.mission__banner-image',
    '.mission__narrative-art',
    '.album-hero__image',
  ]) {
    assert.ok(css.includes(selector), `index.css must style ${selector}`)
  }

  // The old integration rendered the final art at 7–26% opacity, which is why
  // the published interface still looked provisional.
  for (const faintSelector of ['.calendar__frame', '.mission__frame']) {
    assert.equal(
      css.includes(faintSelector),
      false,
      `${faintSelector} must not survive as a near-invisible layer`,
    )
  }

  assert.equal(
    css.includes('.door--available .door__art'),
    false,
    'the door artwork must not be dimmed per state',
  )
  assert.equal(
    css.includes('.door--gift-found .door__art'),
    false,
    'the door artwork must not be dimmed per state',
  )

  const doorArt = ruleBody(css, '.door__art')
  assert.ok(doorArt.length > 0, '.door__art must have a declaration block')
  assert.doesNotMatch(
    doorArt,
    /opacity:\s*0\.[0-4]/,
    '.door__art must stay visible (opacity 0.5 or higher)',
  )

  const logo = ruleBody(css, '.app__logo-image')
  assert.match(logo, /height:\s*auto/, 'the logo must keep its aspect ratio')
  assert.doesNotMatch(
    logo,
    /max-height/,
    'a max-height without an adjusted width distorts the logo',
  )
})
