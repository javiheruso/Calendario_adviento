import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  CIPHER_ALPHABET,
  CIPHER_SYMBOL_COUNT,
  CIPHER_SYMBOL_NAMES,
  CIPHER_WORDS,
  advanceCipherRound,
  cipherSymbolForLetter,
  cipherSymbolName,
  describeCipherSymbol,
  clearCipherInput,
  createCipherGame,
  createCipherState,
  currentCipherRound,
  deleteCipherLetter,
  isCipherComplete,
  letterForCipherSymbol,
  submitCipherWord,
  symbolsForWord,
  typeCipherLetter,
  type SymbolCipherState,
} from '../src/domain/games/symbolCipher'

function typeWord(
  state: SymbolCipherState,
  game: ReturnType<typeof createCipherGame>,
  word: string,
): SymbolCipherState {
  let current = state

  for (const letter of word) {
    current = typeCipherLetter(current, game, letter)
  }

  return current
}

test('the fixed alphabet has exactly fourteen approved symbols', () => {
  assert.equal(CIPHER_SYMBOL_COUNT, 14)
  assert.equal(CIPHER_ALPHABET.length, 14)
  assert.deepEqual(
    CIPHER_ALPHABET.map((symbol) => [symbol.id, symbol.letter]),
    [
      ['tree', 'A'],
      ['bell', 'E'],
      ['gift', 'I'],
      ['snowman', 'O'],
      ['reindeer', 'U'],
      ['star', 'M'],
      ['mitten', 'G'],
      ['sleigh', 'L'],
      ['snowflake', 'N'],
      ['candy', 'S'],
      ['candle', 'T'],
      ['sock', 'R'],
      ['sparkle', 'Z'],
      ['mistletoe', 'Y'],
    ],
  )
  assert.equal(new Set(CIPHER_ALPHABET.map((symbol) => symbol.id)).size, 14)
  assert.equal(new Set(CIPHER_ALPHABET.map((symbol) => symbol.letter)).size, 14)
})

test('every symbol has a stable accessible name and reference description', () => {
  assert.equal(Object.keys(CIPHER_SYMBOL_NAMES).length, 14)
  assert.equal(cipherSymbolName('tree'), 'Árbol')
  assert.equal(cipherSymbolName('snowman'), 'Muñeco de nieve')
  assert.equal(cipherSymbolName('sparkle'), 'Destello')
  assert.equal(describeCipherSymbol('tree'), 'Árbol: letra A')
  assert.equal(describeCipherSymbol('sparkle'), 'Destello: letra Z')
  assert.equal(cipherSymbolName('mistletoe'), 'Muérdago')
  assert.equal(describeCipherSymbol('mistletoe'), 'Muérdago: letra Y')
  assert.equal(new Set(Object.values(CIPHER_SYMBOL_NAMES)).size, 14)
})

test('the table resolves both directions and the three approved words', () => {
  assert.equal(letterForCipherSymbol('tree'), 'A')
  assert.equal(letterForCipherSymbol('sparkle'), 'Z')
  assert.equal(cipherSymbolForLetter('m'), 'star')
  assert.equal(cipherSymbolForLetter('Z'), 'sparkle')
  assert.equal(cipherSymbolForLetter('Y'), 'mistletoe')
  assert.equal(cipherSymbolForLetter('Q'), null)

  assert.deepEqual(symbolsForWord('Y'), ['mistletoe'])
  assert.deepEqual(symbolsForWord('LUNA'), [
    'sleigh',
    'reindeer',
    'snowflake',
    'tree',
  ])
  assert.deepEqual(symbolsForWord('TRINEO'), [
    'candle',
    'sock',
    'gift',
    'snowflake',
    'bell',
    'snowman',
  ])
  assert.deepEqual(symbolsForWord('ESTRELLA'), [
    'bell',
    'candy',
    'candle',
    'sock',
    'bell',
    'sleigh',
    'sleigh',
    'tree',
  ])

  const game = createCipherGame(CIPHER_WORDS)
  assert.deepEqual(
    game.rounds.map((round) => round.word),
    ['LUNA', 'TRINEO', 'ESTRELLA'],
  )
})

test('the built-in keyboard accepts letters up to the word length only', () => {
  const game = createCipherGame(CIPHER_WORDS)
  let state = createCipherState(game)

  assert.equal(currentCipherRound(game, state)?.word, 'LUNA')

  state = typeWord(state, game, 'luna')
  assert.equal(state.input, 'LUNA')

  state = typeCipherLetter(state, game, 'X')
  assert.equal(state.input, 'LUNA', 'no extra letters are accepted')

  state = deleteCipherLetter(state)
  assert.equal(state.input, 'LUN')
  state = clearCipherInput(state)
  assert.equal(state.input, '')
})

test('incomplete and wrong answers keep the input editable', () => {
  const game = createCipherGame(CIPHER_WORDS)
  const state = typeWord(createCipherState(game), game, 'LUN')
  const incomplete = submitCipherWord(game, state)
  assert.equal(incomplete.result, 'incomplete')
  assert.equal(incomplete.state, state)

  const wrongState = { ...state, input: 'LUNX' }
  const rejected = submitCipherWord(game, wrongState)
  assert.equal(rejected.result, 'wrong')
  assert.equal(rejected.state.lastResult, 'wrong')
  assert.equal(rejected.state.input, 'LUNX')

  const repaired = deleteCipherLetter(rejected.state)
  assert.equal(repaired.lastResult, 'none')
  assert.equal(repaired.input, 'LUN')
})

test('deciphering LUNA, TRINEO and ESTRELLA completes the mission', () => {
  const game = createCipherGame(CIPHER_WORDS)
  let state = createCipherState(game)

  for (const [index, round] of game.rounds.entries()) {
    assert.equal(currentCipherRound(game, state)?.word, round.word)
    state = typeWord(state, game, round.word)

    const outcome = submitCipherWord(game, state)
    assert.equal(outcome.result, 'correct')
    state = outcome.state
    assert.equal(state.solvedRounds, index + 1)

    state = advanceCipherRound(game, state)
  }

  assert.equal(state.solvedRounds, 3)
  assert.equal(isCipherComplete(state), true)
  assert.equal(advanceCipherRound(game, state), state)
  assert.equal(typeCipherLetter(state, game, 'A'), state)
})

test('a correct word needs exactly one advance before the next one', () => {
  const game = createCipherGame(CIPHER_WORDS)
  let state = typeWord(createCipherState(game), game, 'LUNA')
  state = submitCipherWord(game, state).state

  const untouched = createCipherState(game)
  assert.equal(advanceCipherRound(game, untouched), untouched)
  assert.equal(submitCipherWord(game, state).result, 'ignored')

  const next = advanceCipherRound(game, state)
  assert.equal(next.roundIndex, 1)
  assert.equal(next.input, '')
  assert.equal(next.lastResult, 'none')
  assert.equal(currentCipherRound(game, next)?.word, 'TRINEO')

  assert.equal(advanceCipherRound(game, next), next, 'a second advance cannot skip a word')
})
