import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  SIMON_BELL_COUNT,
  SIMON_BELL_POSITIONS,
  SIMON_FIRST_NOTES,
  SIMON_ROUNDS,
  beginSimonInput,
  createSimonGame,
  createSimonProgress,
  currentSimonSequence,
  isSimonComplete,
  pressSimonBell,
  replaySimonRound,
  simonPressFeedback,
} from '../src/domain/games/bellSimon'
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

test('five cumulative rounds grow from two to six notes', () => {
  const game = createSimonGame(
    SIMON_BELL_COUNT,
    SIMON_ROUNDS,
    SIMON_FIRST_NOTES,
    randomSource(),
  )

  assert.deepEqual(
    game.rounds.map((round) => round.length),
    [2, 3, 4, 5, 6],
  )

  for (let round = 0; round < game.rounds.length; round += 1) {
    for (const note of game.rounds[round]) {
      assert.ok(note >= 0 && note < SIMON_BELL_COUNT)
    }

    if (round > 0) {
      assert.deepEqual(
        game.rounds[round].slice(0, round + 1),
        game.rounds[round - 1],
        'each round starts with the previous sequence',
      )
    }
  }
})

test('the four bells have distinct stable ring positions', () => {
  assert.equal(SIMON_BELL_POSITIONS.length, SIMON_BELL_COUNT)
  assert.deepEqual(
    SIMON_BELL_POSITIONS.map((position) => position.note),
    [0, 1, 2, 3],
  )
  assert.equal(new Set(SIMON_BELL_POSITIONS.map((position) => position.left)).size, 4)
  assert.equal(
    new Set(SIMON_BELL_POSITIONS.map((position) => position.top)).size,
    1,
    'all four bells hang from the same flat peg bar',
  )
  assert.ok(
    SIMON_BELL_POSITIONS.every(
      (position, index, all) =>
        index === 0 || position.left > (all[index - 1]?.left ?? 0),
    ),
    'ring positions must stay in left-to-right order',
  )

  for (const position of SIMON_BELL_POSITIONS) {
    assert.ok(position.left > 0 && position.left < 100)
    assert.ok(position.top > 0 && position.top < 100)
  }
})

test('bell feedback distinguishes correct, wrong and ignored presses', () => {
  assert.equal(simonPressFeedback('progress'), 'correct')
  assert.equal(simonPressFeedback('round-complete'), 'correct')
  assert.equal(simonPressFeedback('game-complete'), 'correct')
  assert.equal(simonPressFeedback('failed'), 'wrong')
  assert.equal(simonPressFeedback('ignored'), null)
})

test('the game starts by showing and accepts input afterwards', () => {
  const game = createSimonGame(4, 5, 2, randomSource())
  const initial = createSimonProgress(game)

  assert.equal(initial.phase, 'showing')
  assert.equal(initial.round, 0)
  assert.equal(initial.inputIndex, 0)

  const ready = beginSimonInput(initial)
  assert.equal(ready.phase, 'input')
  assert.equal(beginSimonInput(ready), ready, 'input is not restarted twice')
  assert.equal(pressSimonBell(game, initial, 0).result, 'ignored')
})

test('a wrong bell pauses the round without losing progress and can be retried', () => {
  const game = createSimonGame(4, 5, 2, randomSource())
  const ready = beginSimonInput(createSimonProgress(game))
  const expected = currentSimonSequence(game, ready)[0]
  const wrong = (expected + 1) % SIMON_BELL_COUNT

  const outcome = pressSimonBell(game, ready, wrong)
  assert.equal(outcome.result, 'failed')
  assert.equal(outcome.progress.phase, 'failed')
  assert.equal(outcome.progress.round, 0)
  assert.equal(outcome.progress.inputIndex, 0)

  const replayed = replaySimonRound(outcome.progress)
  assert.equal(replayed.phase, 'showing')
  assert.equal(replayed.round, 0)
  assert.equal(replayed.inputIndex, 0)

  const retried = beginSimonInput(replayed)
  assert.equal(retried.phase, 'input')
})

test('repeated failures are unlimited and a correct replay still advances', () => {
  const game = createSimonGame(4, 5, 2, randomSource())
  let progress = beginSimonInput(createSimonProgress(game))
  const firstNote = currentSimonSequence(game, progress)[0]
  const wrong = (firstNote + 1) % SIMON_BELL_COUNT

  for (let attempt = 0; attempt < 3; attempt += 1) {
    progress = pressSimonBell(game, progress, wrong).progress
    progress = beginSimonInput(replaySimonRound(progress))
  }

  progress = playRound(game, progress)
  assert.equal(progress.round, 1)
  assert.equal(progress.phase, 'showing')
})

test('completing the five rounds ends the mission', () => {
  const game = createSimonGame(4, 5, 2, randomSource())
  let progress: SimonProgress = createSimonProgress(game)

  for (let round = 0; round < game.rounds.length; round += 1) {
    assert.equal(progress.round, round)
    progress = playRound(game, progress)
  }

  assert.equal(progress.phase, 'complete')
  assert.equal(isSimonComplete(progress), true)

  // A completed game ignores further input and cannot be replayed into a loss.
  assert.equal(pressSimonBell(game, progress, 0).result, 'ignored')
  assert.equal(replaySimonRound(progress), progress)
})
