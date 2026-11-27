import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  FINAL_MAGIC_PHRASE,
  FINAL_MAGIC_WORDS,
  advanceMagicWord,
  clearMagicInput,
  confirmMagicPronunciation,
  createFinalMagicState,
  currentMagicRound,
  deleteMagicLetter,
  isMagicComplete,
  isMagicWordsComplete,
  magicGame,
  submitMagicWord,
  typeMagicLetter,
  type FinalMagicState,
} from '../src/domain/games/finalMagic'
import { symbolsForWord } from '../src/domain/games/symbolCipher'

function typeWord(state: FinalMagicState, word: string): FinalMagicState {
  let current = state

  for (const letter of word) {
    current = typeMagicLetter(current, letter)
  }

  return current
}

function solveWords(): FinalMagicState {
  let state = createFinalMagicState()

  for (const word of FINAL_MAGIC_WORDS) {
    assert.equal(currentMagicRound(state)?.word, word)
    state = typeWord(state, word)
    const outcome = submitMagicWord(state)
    assert.equal(outcome.result, 'correct')
    state = advanceMagicWord(outcome.state)
  }

  return state
}

test('the magic crystal reuses the day 22 alphabet for LUZ MAGIA', () => {
  assert.equal(FINAL_MAGIC_PHRASE, 'LUZ MAGIA')
  assert.deepEqual([...FINAL_MAGIC_WORDS], ['LUZ', 'MAGIA'])
  assert.deepEqual(
    magicGame().rounds.map((round) => round.word),
    ['LUZ', 'MAGIA'],
  )
  assert.deepEqual(symbolsForWord('LUZ'), ['sleigh', 'reindeer', 'sparkle'])
  assert.deepEqual(symbolsForWord('MAGIA'), [
    'star',
    'tree',
    'mitten',
    'gift',
    'tree',
  ])
})

test('the keyboard and word checks reuse the day 22 cipher rules', () => {
  let state = createFinalMagicState()
  state = typeWord(state, 'LUZ')

  assert.equal(state.cipher.input, 'LUZ')
  assert.equal(typeMagicLetter(state, 'A'), state, 'extra letters are ignored')

  state = deleteMagicLetter(state)
  assert.equal(state.cipher.input, 'LU')
  state = clearMagicInput(state)
  assert.equal(state.cipher.input, '')

  const incomplete = submitMagicWord(state)
  assert.equal(incomplete.result, 'incomplete')

  state = typeWord(state, 'MAGI')
  assert.equal(submitMagicWord(state).result, 'wrong')
})

test('pronunciation is manual and only available after both words', () => {
  const initial = createFinalMagicState()

  assert.equal(confirmMagicPronunciation(initial), initial)
  assert.equal(isMagicWordsComplete(initial), false)

  const solved = solveWords()
  assert.equal(isMagicWordsComplete(solved), true)
  assert.equal(isMagicComplete(solved), false, 'deciphering alone does not finish the crystal')

  const pronounced = confirmMagicPronunciation(solved)
  assert.equal(pronounced.pronunciationConfirmed, true)
  assert.equal(isMagicComplete(pronounced), true)
  assert.equal(confirmMagicPronunciation(pronounced), pronounced)
})
