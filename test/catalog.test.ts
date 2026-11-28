import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import { getAsset } from '../src/domain/assets'
import {
  getMission,
  MISSIONS,
  resolveMissionAvailability,
} from '../src/domain/missions'
import { MISSION_DAYS, TOTAL_MISSIONS, type MissionDefinition } from '../src/domain/types'

const IMPLEMENTED_DAYS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24,
] as const

test('the catalog lists all 24 approved missions exactly once', () => {
  assert.equal(TOTAL_MISSIONS, 24)
  assert.equal(MISSIONS.length, 24)
  assert.deepEqual(MISSIONS.map((mission) => mission.day), [...MISSION_DAYS])
  assert.equal(new Set(MISSIONS.map((mission) => mission.day)).size, 24)
})

test('only the approved days are implemented', () => {
  for (const mission of MISSIONS) {
    const expected = IMPLEMENTED_DAYS.includes(
      mission.day as (typeof IMPLEMENTED_DAYS)[number],
    )
    assert.equal(
      mission.status,
      expected ? 'implemented' : 'planned',
      `day ${mission.day}`,
    )
  }
})

test('the implemented days keep their approved mechanics', () => {
  assert.equal(getMission(1)?.kind, 'dance')
  assert.equal(getMission(2)?.kind, 'memory')
  assert.equal(getMission(3)?.kind, 'red-outfit')
  assert.equal(getMission(4)?.kind, 'reindeer-maze')
  assert.equal(getMission(5)?.kind, 'snowball-toss')
  assert.equal(getMission(6)?.kind, 'spot-difference')
  assert.equal(getMission(7)?.kind, 'karaoke')
  assert.equal(getMission(8)?.kind, 'word-scramble')
  assert.equal(getMission(9)?.kind, 'sock-pairs')
  assert.equal(getMission(10)?.kind, 'patterns')
  assert.equal(getMission(11)?.kind, 'guided-drawing')
  assert.equal(getMission(12)?.kind, 'catch-gifts')
  assert.equal(getMission(13)?.kind, 'no-laugh')
  assert.equal(getMission(14)?.kind, 'math-lock')
  assert.equal(getMission(15)?.kind, 'cup-pyramid')
  assert.equal(getMission(16)?.kind, 'jigsaw')
  assert.equal(getMission(17)?.kind, 'charades')
  assert.equal(getMission(18)?.kind, 'bell-simon')
  assert.equal(getMission(19)?.kind, 'hidden-objects')
  assert.equal(getMission(20)?.kind, 'touch-bag')
  assert.equal(getMission(21)?.kind, 'snowman-build')
  assert.equal(getMission(22)?.kind, 'symbol-cipher')
  assert.equal(getMission(23)?.kind, 'craft')
  assert.equal(getMission(24)?.kind, 'finale')
})

test('mission illustrations resolve to final image assets', () => {
  for (const mission of MISSIONS) {
    assert.equal(getAsset(mission.illustration).kind, 'image', mission.illustration)
  }

  assert.equal(getMission(1)?.title, 'El baile del duende')
})

test('the game resources come from the central asset catalog', () => {
  for (const id of [
    'game.memory.back',
    'game.memory.reindeer',
    'game.memory.snowman',
    'game.memory.bell',
    'game.word.snow',
    'game.simon.bell.red',
    'game.simon.bell.green',
    'game.simon.bell.blue',
    'game.simon.bell.gold',
    'game.simon.stand',
    'game.reindeer.walk.a',
    'game.reindeer.walk.b',
    'game.maze.carrot',
    'game.maze.stable',
    'game.spot.scene.a',
    'game.spot.scene.b',
    'game.pattern.star',
    'game.pattern.bell',
    'game.pattern.tree',
    'game.pattern.belt',
    'game.catch.basket',
    'game.catch.gift.red',
    'game.catch.gift.blue',
    'game.catch.gift.green',
    'game.catch.gift.gold',
    'game.jigsaw.portrait',
    'game.math.tree',
    'game.math.gift',
    'game.math.reindeer',
    'game.math.star',
    'game.math.chest',
    'game.math.chest.open',
    'game.hidden.scene',
    'game.hidden.gift',
    'game.hidden.bell',
    'game.hidden.candyCane',
    'game.hidden.santaHat',
    'game.hidden.blueBauble',
    'game.hidden.star',
    'game.snowman.phase.base',
    'game.snowman.phase.hat',
    'game.snowman.phase.nose',
    'game.snowman.phase.scarf',
    'game.snowman.phase.buttons',
    'game.snowman.option.hat.top',
    'game.snowman.option.nose.carrot',
    'game.snowman.option.scarf.red',
    'game.snowman.option.buttons.coal',
    'game.cipher.tree',
    'game.cipher.mistletoe',
    'game.red.garment.one',
    'game.red.garment.two',
    'game.red.object',
    'game.snowball.target',
    'game.sock.red',
    'game.drawing.reindeer',
    'game.laugh.child',
    'game.pyramid.mitten',
    'game.charades.hidden',
    'game.charades.elephant',
    'game.charades.gorilla',
    'game.charades.reindeer',
    'game.touch.bag',
    'game.touch.bag.open',
    'game.craft.drawing',
    'game.craft.letter',
    'game.craft.craft',
    'game.craft.farewell',
    'game.craft.excited',
    'game.dance.jump',
    'game.dance.celebrate',
    'game.karaoke.stage',
    'game.karaoke.microphone',
    'game.karaoke.trasto',
    'game.final.santa',
    'game.final.crystal.red.off',
    'game.final.crystal.red.on',
    'game.final.crystal.blue.off',
    'game.final.crystal.blue.on',
    'game.final.crystal.gold.off',
    'game.final.crystal.gold.on',
    'game.final.sleigh.prepared',
    'game.final.sleigh.flying',
    'game.final.album',
  ] as const) {
    assert.ok(getAsset(id), id)
  }

  assert.equal(getAsset('game.jigsaw.portrait').kind, 'image')
  assert.equal(getAsset('game.spot.scene.a').kind, 'image')
  assert.equal(getAsset('game.hidden.scene').kind, 'image')
})

test('mission status decides the child flow before the demo flag', () => {
  const implemented: MissionDefinition = getMission(7)!
  const planned: MissionDefinition = { ...implemented, status: 'planned' }

  assert.equal(
    resolveMissionAvailability(planned, { demoMode: false, development: false }),
    'planned',
  )
  assert.equal(
    resolveMissionAvailability(planned, { demoMode: false, development: true }),
    'demo-completion',
  )
  assert.equal(
    resolveMissionAvailability(planned, { demoMode: true, development: false }),
    'demo-completion',
  )
  assert.equal(
    resolveMissionAvailability(implemented, { demoMode: false, development: false }),
    'game',
  )
  assert.equal(
    resolveMissionAvailability(getMission(2)!, { demoMode: false, development: false }),
    'game',
  )
})
