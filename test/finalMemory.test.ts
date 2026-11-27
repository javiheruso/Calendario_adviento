import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  beginSimonInput,
  createSimonProgress,
  currentSimonSequence,
  isSimonComplete,
  pressSimonBell,
  replaySimonRound,
} from '../src/domain/games/bellSimon'
import {
  FINAL_BELL_COUNT,
  FINAL_BELL_ROUND_LENGTHS,
  createFinalBellGame,
} from '../src/domain/games/finalMemory'
import type { SimonGame, SimonProgress } from '../src/domain/games/bellSimon'
import { sequenceRandom } from './random'

function randomSource() {
  return sequenceRandom([0.1, 0.35, 0.6, 0.85, 0.2, 0.45, 0.7, 0.95, 0.3, 0.55])
}

function playRound(game: SimonGame, progress: SimonProgress): SimonProgress {
  const ready = beginSimonInput(progress)
  let current = ready

  for (const note of currentSimonSequence(game, ready)) {
    const outcome = pressSimonBell(game, current, note)
    assert.notEqual(outcome.result, 'failed')
    current = outcome.progress
  }

  return current
}

test('the memory crystal has three independent sequences of 3, 4 and 5 notes', () => {
  const game = createFinalBellGame(randomSource())

  assert.deepEqual(game.rounds.map((round) => round.length), [...FINAL_BELL_ROUND_LENGTHS])
  assert.deepEqual(game.rounds, [
    [0, 1, 2],
    [3, 0, 1, 2],
    [3, 1, 2, 0, 1],
  ])

  for (const round of game.rounds) {
    for (const note of round) {
      assert.ok(note >= 0 && note < FINAL_BELL_COUNT)
    }
  }

  assert.notDeepEqual(
    game.rounds[1].slice(0, game.rounds[0].length),
    game.rounds[0],
    'the day 24 sequences are not cumulative',
  )
})

test('the reused Simon rules complete the three sequences with retries', () => {
  const game = createFinalBellGame(randomSource())
  let progress = createSimonProgress(game)

  const ready = beginSimonInput(progress)
  const first = currentSimonSequence(game, ready)[0]
  const wrong = (first + 1) % FINAL_BELL_COUNT
  const failed = pressSimonBell(game, ready, wrong)

  assert.equal(failed.result, 'failed')
  const replayed = replaySimonRound(failed.progress)
  assert.equal(replayed.phase, 'showing')

  progress = replayed

  for (let round = 0; round < game.rounds.length; round += 1) {
    progress = playRound(game, progress)
  }

  assert.equal(isSimonComplete(progress), true)
  assert.equal(pressSimonBell(game, progress, 0).result, 'ignored')
})
