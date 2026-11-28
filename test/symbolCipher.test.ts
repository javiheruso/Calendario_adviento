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
  assert.deepEqual(symbolsForWord('RENO'), ['sock', 'bell', 'snowflake', 'snowman'])
  assert.deepEqual(symbolsForWord('MAGIA'), [
    'star',
    'tree',
    'mitten',
    'gift',
    'tree',
  ])
  assert.deepEqual(symbolsForWord('REGALO'), [
    'sock',
    'bell',
    'mitten',
    'tree',
    'sleigh',
    'snowman',
  ])

  const game = createCipherGame(CIPHER_WORDS)
  assert.deepEqual(
    game.rounds.map((round) => round.word),
    ['RENO', 'MAGIA', 'REGALO'],
  )
})

test('the built-in keyboard accepts letters up to the word length only', () => {
  const game = createCipherGame(CIPHER_WORDS)
  let state = createCipherState(game)

  assert.equal(currentCipherRound(game, state)?.word, 'RENO')

  state = typeWord(state, game, 'reno')
  assert.equal(state.input, 'RENO')

  state = typeCipherLetter(state, game, 'X')
  assert.equal(state.input, 'RENO', 'no extra letters are accepted')

  state = deleteCipherLetter(state)
  assert.equal(state.input, 'REN')
  state = clearCipherInput(state)
  assert.equal(state.input, '')
})

test('incomplete and wrong answers keep the input editable', () => {
  const game = createCipherGame(CIPHER_WORDS)
  let state = createCipherState(game)

  state = typeWord(state, game, 'REN')
  const incomplete = submitCipherWord(game, state)
  assert.equal(incomplete.result, 'incomplete')
  assert.equal(incomplete.state, state)

  state = typeCipherLetter(state, game, 'A')
  const wrong = submitCipherWord(game, state)
  assert.equal(wrong.result, 'wrong')
  assert.equal(wrong.state.lastResult, 'wrong')
  assert.equal(wrong.state.input, 'RENA')

  state = deleteCipherLetter(wrong.state)
  assert.equal(state.lastResult, 'none')
})

test('deciphering RENO, MAGIA and REGALO completes the mission', () => {
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

test('a correct word needs an explicit advance before the next one', () => {
  const game = createCipherGame(CIPHER_WORDS)
  let state = typeWord(createCipherState(game), game, 'RENO')
  state = submitCipherWord(game, state).state

  const untouched = createCipherState(game)
  assert.equal(advanceCipherRound(game, untouched), untouched)
  assert.equal(submitCipherWord(game, state).result, 'ignored')

  const next = advanceCipherRound(game, state)
  assert.equal(next.roundIndex, 1)
  assert.equal(next.input, '')
  assert.equal(next.lastResult, 'none')
  assert.equal(currentCipherRound(game, next)?.word, 'MAGIA')
})
