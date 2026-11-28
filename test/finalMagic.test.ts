import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  FINAL_MAGIC_GROUP_LENGTHS,
  FINAL_MAGIC_GROUPS,
  FINAL_MAGIC_LETTERS,
  FINAL_MAGIC_PHRASE,
  FINAL_MAGIC_SYMBOL_GROUPS,
  FINAL_MAGIC_SYMBOLS,
  clearMagicInput,
  confirmMagicPronunciation,
  createFinalMagicState,
  deleteMagicLetter,
  isMagicComplete,
  isMagicWordsComplete,
  submitMagicPhrase,
  typeMagicLetter,
  type FinalMagicState,
} from '../src/domain/games/finalMagic'
import { symbolsForWord } from '../src/domain/games/symbolCipher'

function typePhrase(state: FinalMagicState, text: string): FinalMagicState {
  let current = state

  for (const letter of text) {
    current = typeMagicLetter(current, letter)
  }

  return current
}

test('the conjure is one nine-letter cipher grouped 3-1-5', () => {
  assert.equal(FINAL_MAGIC_PHRASE, 'LUZ Y MAGIA')
  assert.deepEqual([...FINAL_MAGIC_GROUPS], ['LUZ', 'Y', 'MAGIA'])
  assert.deepEqual(FINAL_MAGIC_GROUP_LENGTHS, [3, 1, 5])
  assert.equal(FINAL_MAGIC_LETTERS, 'LUZYMAGIA')
  assert.equal(FINAL_MAGIC_LETTERS.length, 9)
  assert.equal(FINAL_MAGIC_SYMBOLS.length, 9)
  assert.deepEqual(
    FINAL_MAGIC_SYMBOL_GROUPS.map((group) => group.length),
    [3, 1, 5],
  )
  assert.deepEqual(FINAL_MAGIC_SYMBOL_GROUPS[0], symbolsForWord('LUZ'))
  assert.deepEqual(FINAL_MAGIC_SYMBOL_GROUPS[1], symbolsForWord('Y'))
  assert.deepEqual(FINAL_MAGIC_SYMBOL_GROUPS[2], symbolsForWord('MAGIA'))
})

test('the single input accepts one letter per slot and can be erased', () => {
  let state = createFinalMagicState()

  state = typePhrase(state, 'LUZYMAGIA')
  assert.equal(state.input, 'LUZYMAGIA')
  assert.equal(typeMagicLetter(state, 'A'), state, 'no tenth letter is accepted')

  state = deleteMagicLetter(state)
  assert.equal(state.input, 'LUZYMAGI')
  state = clearMagicInput(state)
  assert.equal(state.input, '')
})

test('incomplete and wrong conjures keep the input editable', () => {
  const incomplete = submitMagicPhrase(typePhrase(createFinalMagicState(), 'LUZYMAGI'))
  assert.equal(incomplete.result, 'incomplete')

  const wrongState = typePhrase(createFinalMagicState(), 'LUZYMAGIX')
  const wrong = submitMagicPhrase(wrongState)
  assert.equal(wrong.result, 'wrong')
  assert.equal(wrong.state.solved, false)
  assert.equal(wrong.state.input, 'LUZYMAGIX')

  const repaired = deleteMagicLetter(wrong.state)
  assert.equal(repaired.input, 'LUZYMAGI')
})

test('one verification solves the cipher and locks further edits', () => {
  const ready = typePhrase(createFinalMagicState(), 'LUZYMAGIA')
  const outcome = submitMagicPhrase(ready)

  assert.equal(outcome.result, 'correct')
  assert.equal(outcome.state.solved, true)
  assert.equal(isMagicWordsComplete(outcome.state), true)
  assert.equal(typeMagicLetter(outcome.state, 'A'), outcome.state)
  assert.equal(deleteMagicLetter(outcome.state), outcome.state)
  assert.equal(clearMagicInput(outcome.state), outcome.state)
  assert.equal(submitMagicPhrase(outcome.state).result, 'ignored')
})

test('pronunciation is manual and only available after the cipher is solved', () => {
  const initial = createFinalMagicState()

  assert.equal(confirmMagicPronunciation(initial), initial)
  assert.equal(isMagicWordsComplete(initial), false)

  const solved = submitMagicPhrase(typePhrase(initial, 'LUZYMAGIA')).state
  assert.equal(isMagicComplete(solved), false, 'the cipher alone does not finish the crystal')

  const pronounced = confirmMagicPronunciation(solved)
  assert.equal(pronounced.pronunciationConfirmed, true)
  assert.equal(isMagicComplete(pronounced), true)
  assert.equal(confirmMagicPronunciation(pronounced), pronounced)
})
