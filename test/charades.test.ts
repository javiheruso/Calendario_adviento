import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  CHARADE_ANIMALS,
  CHARADES_ANIMAL_BANK_SIZE,
  CHARADES_ROUNDS,
  canConfirmCharadeHit,
  confirmCharadeHit,
  createCharadesState,
  currentCharadeAnimal,
  hideCharadeAnimal,
  isCharadesComplete,
  revealCharadeAnimal,
  toggleCharadeAnimal,
} from '../src/domain/games/charades'
import { sequenceRandom } from './random'

test('the animal bank is the exact approved list of twelve', () => {
  const state = createCharadesState(sequenceRandom([0.1, 0.3, 0.5, 0.7, 0.9]))

  assert.deepEqual(
    CHARADE_ANIMALS.map((animal) => animal.id),
    [
      'elephant',
      'cat',
      'dog',
      'lion',
      'monkey',
      'penguin',
      'rabbit',
      'hen',
      'gorilla',
      'duck',
      'frog',
      'reindeer',
    ],
  )
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

test('the card starts face down and only the explicit reveal shows it', () => {
  const initial = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))

  assert.equal(initial.animalVisible, false)
  assert.equal(initial.revealedOnce, false)
  assert.equal(initial.hits, 0)
  assert.equal(initial.phase, 'playing')
  assert.equal(currentCharadeAnimal(initial), initial.animals[0])
  assert.equal(canConfirmCharadeHit(initial), false, 'a hidden card was never shown')

  const shown = revealCharadeAnimal(initial)
  assert.equal(shown.animalVisible, true)
  assert.equal(revealCharadeAnimal(shown), shown, 'revealing twice is idempotent')
  assert.equal(canConfirmCharadeHit(shown), false, 'a visible card cannot be confirmed')

  const hidden = hideCharadeAnimal(shown)
  assert.equal(hidden.animalVisible, false)
  assert.equal(hidden.revealedOnce, true)
  assert.equal(hideCharadeAnimal(hidden), hidden, 'hiding twice is idempotent')
  assert.equal(canConfirmCharadeHit(hidden), true)
})

test('the toggle helper maps to the same hold-and-hide gate', () => {
  const initial = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))
  const shown = toggleCharadeAnimal(initial)
  const hidden = toggleCharadeAnimal(shown)

  assert.equal(shown.animalVisible, true)
  assert.equal(hidden.animalVisible, false)
  assert.equal(hidden.revealedOnce, true)
})

test('a hit is ignored until the card was shown and hidden again', () => {
  const initial = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))

  assert.equal(confirmCharadeHit(initial), initial)

  const shown = revealCharadeAnimal(initial)
  assert.equal(confirmCharadeHit(shown), shown, 'showing alone is not enough')

  const hidden = hideCharadeAnimal(shown)
  const confirmed = confirmCharadeHit(hidden)
  assert.equal(confirmed.hits, 1)
  assert.equal(confirmed.roundIndex, 1)
  assert.equal(confirmed.animalVisible, false)
  assert.equal(confirmed.revealedOnce, false, 'the next animal needs its own show → hide cycle')
  assert.equal(confirmCharadeHit(confirmed), confirmed)
})

test('each confirmed hit advances to a new hidden animal with a reset gate', () => {
  let state = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))
  const animals = state.animals

  state = confirmAfterReveal(state)
  assert.equal(currentCharadeAnimal(state), animals[1])
  assert.equal(canConfirmCharadeHit(state), false)

  state = confirmAfterReveal(state)
  assert.equal(currentCharadeAnimal(state), animals[2])
  assert.equal(canConfirmCharadeHit(state), false)
})

test('three gated hits complete the mission and further input is ignored', () => {
  let state = createCharadesState(sequenceRandom([0.2, 0.4, 0.6]))

  state = confirmAfterReveal(state)
  state = confirmAfterReveal(state)
  assert.equal(state.hits, 2)
  assert.equal(state.phase, 'playing')

  state = confirmAfterReveal(state)
  assert.equal(state.hits, 3)
  assert.equal(state.phase, 'complete')
  assert.equal(state.animalVisible, false)
  assert.equal(isCharadesComplete(state), true)

  assert.equal(confirmCharadeHit(state), state)
  assert.equal(revealCharadeAnimal(state), state)
  assert.equal(hideCharadeAnimal(state), state)
  assert.equal(toggleCharadeAnimal(state), state)
})

function confirmAfterReveal(
  state: ReturnType<typeof createCharadesState>,
): ReturnType<typeof createCharadesState> {
  return confirmCharadeHit(hideCharadeAnimal(revealCharadeAnimal(state)))
}
