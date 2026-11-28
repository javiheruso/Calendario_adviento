import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const PROJECT_ROOT = resolve(__dirname, '../../..')
const SRC_ROOT = resolve(PROJECT_ROOT, 'src')
const CSS_PATH = resolve(SRC_ROOT, 'index.css')

function readSource(relativePath: string): string {
  return readFileSync(resolve(SRC_ROOT, relativePath), 'utf8')
}

function ruleBody(css: string, selector: string): string {
  const start = css.indexOf(`${selector} {`)

  if (start === -1) {
    return ''
  }

  return css.slice(start, css.indexOf('}', start))
}

test('the mission frame wraps the title, brief and main illustration', () => {
  const source = readSource('components/MissionPanel.tsx')
  const bannerStart = source.indexOf('<figure className="mission__banner">')
  const bannerEnd = source.indexOf('</figure>', bannerStart)
  const contentStart = source.indexOf('mission__banner-content')
  const title = source.indexOf('id="mission-title"')
  const brief = source.indexOf('mission__narrative')
  const illustration = source.indexOf('getAsset(mission.illustration)')
  const mascot = source.indexOf("'brand.trasto.explains'")
  const stage = source.indexOf('mission__stage')

  assert.ok(bannerStart >= 0, 'the mission frame must exist')
  assert.ok(bannerEnd > bannerStart, 'the mission frame must have a closing tag')
  assert.ok(
    contentStart > bannerStart && contentStart < bannerEnd,
    'the frame must hold the hero content, not stand empty',
  )

  for (const [name, index] of [
    ['title', title],
    ['brief', brief],
    ['main illustration', illustration],
  ] as const) {
    assert.ok(
      index > contentStart && index < bannerEnd,
      `${name} must live inside the mission frame`,
    )
  }

  assert.ok(
    mascot > bannerStart && mascot < bannerEnd,
    'Trasto must stay in the frame or slightly overlap it',
  )
  assert.ok(stage > bannerEnd, 'the game and reward stage must stay outside the frame')
})

test('the tree artwork is the relative container for the 24 absolute stars', () => {
  const source = readSource('components/StarTree.tsx')
  const css = readFileSync(CSS_PATH, 'utf8')
  const scene = ruleBody(css, '.tree__scene')
  const stars = ruleBody(css, '.tree__stars')
  const star = ruleBody(css, '.star')

  assert.ok(
    source.includes('STAR_POSITIONS'),
    'StarTree must render the domain percentage positions',
  )
  assert.ok(
    source.includes('hasStar(progress, day)'),
    'a star must switch only through the existing gift-found progress rule',
  )

  assert.match(scene, /position:\s*relative/, '.tree__scene must anchor the stars')
  assert.match(scene, /aspect-ratio:\s*2\s*\/\s*3/, 'the tree must keep its 2:3 ratio')
  assert.match(stars, /position:\s*absolute/, 'the star layer must overlay the tree')
  assert.doesNotMatch(
    stars,
    /grid-template-columns/,
    'the horizontal bottom star row must be removed',
  )
  assert.match(star, /position:\s*absolute/, 'each star must use an absolute position')
})

test('the mission frame styles the final artwork as a full hero background', () => {
  const css = readFileSync(CSS_PATH, 'utf8')
  const banner = ruleBody(css, '.mission__banner')
  const frame = ruleBody(css, '.mission__banner-image')

  assert.match(banner, /position:\s*relative/)
  assert.match(banner, /aspect-ratio:\s*3\s*\/\s*2/)
  assert.match(frame, /position:\s*absolute/)
  assert.match(frame, /object-fit:\s*fill/)
})
