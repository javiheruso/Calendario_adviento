import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { existsSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { ASSET_CATALOG } from '../src/domain/assets'

const PUBLIC_ROOT = resolve(__dirname, '../../..', 'public')

test('every image asset points at a real file under public/', () => {
  const imageEntries = Object.entries(ASSET_CATALOG).filter(
    ([, asset]) => asset.kind === 'image',
  )

  assert.ok(imageEntries.length > 0, 'the catalog must declare images')

  for (const [id, asset] of imageEntries) {
    if (asset.kind !== 'image') {
      continue
    }

    assert.ok(asset.src.length > 0, `${id} has an empty src`)
    assert.ok(!asset.src.includes('..'), `${id} must stay inside public/`)
    assert.ok(!asset.src.startsWith('/'), `${id} must be public-relative`)

    const filePath = resolve(PUBLIC_ROOT, asset.src)
    assert.equal(existsSync(filePath), true, `${id} -> missing public/${asset.src}`)
    assert.ok(statSync(filePath).size > 0, `${id} -> empty public/${asset.src}`)
    assert.equal(
      asset.provisional,
      false,
      `${id} -> an existing image must not be marked provisional`,
    )
  }
})

test('image assets use a browser-safe final format', () => {
  for (const [id, asset] of Object.entries(ASSET_CATALOG)) {
    if (asset.kind !== 'image') {
      continue
    }

    assert.match(asset.src, /\.(?:webp|svg|png|jpe?g)$/i, `${id} uses a supported format`)
  }
})

test('every mission illustration resolves to an existing image asset', () => {
  for (let day = 1; day <= 24; day += 1) {
    const id = `mission.${String(day).padStart(2, '0')}`
    const asset = ASSET_CATALOG[id as keyof typeof ASSET_CATALOG]

    assert.ok(asset, `${id} is missing`)
    assert.equal(asset.kind, 'image', `${id} should use final artwork`)
  }
})

test('the known absent assets remain clearly documented as provisional emoji', () => {
  const santa = ASSET_CATALOG['game.final.santa']
  const pine = ASSET_CATALOG['game.maze.tree']

  assert.equal(santa.kind, 'emoji')
  assert.equal(santa.provisional, true)
  assert.match(santa.label, /sin recurso final/i)

  assert.equal(pine.kind, 'emoji')
  assert.equal(pine.provisional, true)
  assert.match(pine.label, /no final asset/i)
})
