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

test('maths operations never render numeric values and the table is separate', () => {
  const day14 = readSource('components/games/MathLockGame.tsx')
  const day24 = readSource('components/games/finale/IntelligenceCrystal.tsx')

  for (const source of [day14, day24]) {
    assert.doesNotMatch(source, /math-expression__value/)
    assert.doesNotMatch(source, /showNumbers/)
  }

  assert.doesNotMatch(day24, /FINAL_INTEL_VALUES\[term\.symbol\]/)
  assert.match(day14, /<table className="math-table">/)
  assert.match(day24, /<table className="math-table">/)
  assert.match(day14, /game\.math\.(tree|gift|reindeer|star)/)
})

test('the child mystery bag no longer lists safe example objects', () => {
  const source = readSource('components/games/TouchBagGame.tsx')

  assert.doesNotMatch(source, /TOUCH_BAG_SAFE_IDEAS/)
  assert.doesNotMatch(source, /Ideas de objetos seguros/)
  assert.match(source, /TOUCH_BAG_SLOT_IDS/)
  assert.match(source, /game\.touch\.bag/)
})

test('day 8 uses individual wooden tiles, a hero clue and auto-advance', () => {
  const source = readSource('components/games/WordScrambleGame.tsx')

  assert.match(source, /scramble-tile/)
  assert.match(source, /scramble-hero/)
  assert.match(source, /useAutoAdvance/)
  assert.doesNotMatch(source, /game\.word\.board/)
})

test('day 17 is hold-to-reveal and gates the manual hit', () => {
  const source = readSource('components/games/CharadesGame.tsx')

  assert.match(source, /canConfirmCharadeHit/)
  assert.match(source, /revealCharadeAnimal/)
  assert.match(source, /hideCharadeAnimal/)
  assert.match(source, /onPointerDown/)
  assert.match(source, /onPointerUp/)
  assert.match(source, /onKeyDown/)
  assert.match(source, /disabled=\{!canConfirm\}/)
})

test('day 21 shows one large phase image and swaps it on success', () => {
  const source = readSource('components/games/SnowmanGame.tsx')

  assert.match(source, /snowmanPhaseImageIndex/)
  assert.match(source, /snowman-figure__box/)
  assert.match(source, /snowman-figure__image--active/)
  assert.doesNotMatch(source, /snowman-gallery/)
})

test('days 18 and 24 share the bell stand composition', () => {
  const day18 = readSource('components/games/BellSimonGame.tsx')
  const day24 = readSource('components/games/finale/MemoryCrystal.tsx')

  for (const source of [day18, day24]) {
    assert.match(source, /BellStand/)
    assert.match(source, /feedback/)
    assert.doesNotMatch(source, /type="checkbox"/)
  }
})

test('day 22 auto-advances without leaking the answers in the intro', () => {
  const source = readSource('components/games/SymbolCipherGame.tsx')

  assert.match(source, /useAutoAdvance/)
  assert.match(source, /advanceOnce/)
  assert.doesNotMatch(source, /descifrar (RENO|MAGIA|REGALO|LUNA|TRINEO|ESTRELLA)/)
})

test('day 24 shows the conjure phrase only after the cipher is solved', () => {
  const source = readSource('components/games/finale/MagicCrystal.tsx')
  const phraseIndex = source.indexOf('{FINAL_MAGIC_PHRASE}')
  const pronunciationIndex = source.indexOf('{solved && !complete ?')

  assert.ok(phraseIndex > -1)
  assert.ok(pronunciationIndex > -1)
  assert.ok(
    phraseIndex > pronunciationIndex,
    'the phrase must not be rendered before the solved pronunciation step',
  )
  assert.doesNotMatch(source, /LUZ Y MAGIA/)
  assert.match(source, /FINAL_MAGIC_GROUP_LENGTHS/)
  assert.match(source, /submitMagicPhrase/)
})

test('the app persists the star before returning and keeps preview isolated', () => {
  const source = readSource('App.tsx')

  assert.match(source, /STAR_EARNED_EVENT/)
  assert.match(source, /persistBeforePublish/)
  assert.match(source, /onRewardReturn/)
  assert.match(source, /usingDemoProgress/)
  assert.match(source, /data-star-day/)
  assert.match(source, /shouldReturnToCalendar|handleRewardReturn/)
})

test('celebration and success audio run only after a successful save', () => {
  const source = readSource('App.tsx')

  const confirmIndex = source.indexOf('onConfirmGift={() => {')
  const savedIndex = source.indexOf('const saved = handleConfirmGift()', confirmIndex)
  const celebrationAudioIndex = source.indexOf(
    "audioManager.playEffect('effect.celebration')",
    confirmIndex,
  )

  assert.ok(confirmIndex > -1)
  assert.ok(savedIndex > confirmIndex, 'the gift confirmation must be persisted first')
  assert.ok(
    celebrationAudioIndex > savedIndex,
    'celebration audio must wait for the save result',
  )
  assert.match(
    source,
    /if \(saved\) \{\s*audioManager\.playEffect\('effect\.celebration'\)\s*\}/,
  )

  const completeIndex = source.indexOf('onCompleteMission={() => {')
  const completeSaveIndex = source.indexOf('if (updateProgress(next))', completeIndex)
  const successAudioIndex = source.indexOf(
    "audioManager.playEffect('effect.success')",
    completeIndex,
  )

  assert.ok(completeIndex > -1)
  assert.ok(completeSaveIndex > completeIndex, 'mission completion must be persisted first')
  assert.ok(
    successAudioIndex > completeSaveIndex,
    'success audio must wait for the save result',
  )
})

test('the mobile frame and new game layouts exist in the stylesheet', () => {
  const css = readFileSync(CSS_PATH, 'utf8')

  for (const selector of [
    '@media (max-width: 640px)',
    '.maze-board',
    '.maze-reindeer',
    '.scramble-tile',
    '.simon-stage .simon-bells',
    '.snowman-figure__box',
    '.cipher-word__group',
    '.star--celebrating',
    'prefers-reduced-motion',
  ]) {
    assert.ok(css.includes(selector), `${selector} must be styled`)
  }

  assert.match(css, /\.app__logo-image\s*\{[^}]*width:\s*min\(58%/)
  assert.match(css, /overflow-x:\s*clip/)
})
