import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  CHARADE_ANIMALS,
  CHARADES_ANIMAL_BANK_SIZE,
  CHARADES_ROUNDS,
  confirmCharadeHit,
  createCharadesState,
  currentCharadeAnimal,
  isCharadesComplete,
  toggleCharadeAnimal,
} from '../src/domain/games/charades'
import { sequenceRandom } from './random'

test('the animal bank has twelve options and the game draws three', () => {
  const state = createCharadesState(sequenceRandom([0.1, 0.3, 0.5, 0.7, 0.9]))

  assert.equal(CHARADE_ANIMALS.length, 12)
  assert.equal(CHARADES_ANIMAL_BANK_SIZE, 12)
  assert.equal(CHARADES_ROUNDS, 3)
  assert.equal(state.animals.length, 3)
  assert.equal(new Set(state.animals.map((animal) => animal.id)).size, 3)

  const bankIds = new Set(CHARADE_ANIMALS.map((animal) => animal.id))
  for (const animal of state.animals) {
    assert.equal(bankIds.has(animal.id), true, animal.id)
  }
})

test('the current animal starts hidden and can be shown or hidden again', () => {
  const initial = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))

  assert.equal(initial.animalVisible, false)
  assert.equal(initial.hits, 0)
  assert.equal(initial.phase, 'playing')
  assert.equal(currentCharadeAnimal(initial), initial.animals[0])

  const shown = toggleCharadeAnimal(initial)
  assert.equal(shown.animalVisible, true)

  const hidden = toggleCharadeAnimal(shown)
  assert.equal(hidden.animalVisible, false)
})

test('each confirmed hit advances to the next hidden animal', () => {
  let state = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))
  const animals = state.animals
  state = toggleCharadeAnimal(state)

  state = confirmCharadeHit(state)
  assert.equal(state.hits, 1)
  assert.equal(state.roundIndex, 1)
  assert.equal(state.animalVisible, false)
  assert.equal(currentCharadeAnimal(state), animals[1])
  assert.equal(isCharadesComplete(state), false)
})

test('three manual hits complete the mission and further hits are ignored', () => {
  let state = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))

  state = confirmCharadeHit(state)
  state = confirmCharadeHit(state)
  assert.equal(state.hits, 2)
  assert.equal(state.phase, 'playing')

  state = confirmCharadeHit(state)
  assert.equal(state.hits, 3)
  assert.equal(state.phase, 'complete')
  assert.equal(state.animalVisible, false)
  assert.equal(isCharadesComplete(state), true)

  assert.equal(confirmCharadeHit(state), state)
  assert.equal(toggleCharadeAnimal(state), state)
})
