import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  CRAFT_SURPRISE_OPTIONS,
  confirmCraftSurprise,
  createCraftSurpriseState,
  isCraftSurpriseComplete,
  selectCraftSurprise,
  selectedCraftOption,
} from '../src/domain/games/craftSurprise'

test('there are three handmade surprise options and nothing is chosen yet', () => {
  const state = createCraftSurpriseState()

  assert.equal(CRAFT_SURPRISE_OPTIONS.length, 3)
  assert.deepEqual(
    CRAFT_SURPRISE_OPTIONS.map((option) => option.id),
    ['drawing', 'letter', 'craft'],
  )
  assert.equal(state.selected, null)
  assert.equal(state.confirmed, false)
  assert.equal(selectedCraftOption(state), null)
  assert.equal(isCraftSurpriseComplete(state), false)
})

test('the surprise can be changed until the family confirms it', () => {
  let state = createCraftSurpriseState()

  state = selectCraftSurprise(state, 'drawing')
  assert.equal(state.selected, 'drawing')
  assert.equal(selectedCraftOption(state)?.id, 'drawing')

  state = selectCraftSurprise(state, 'letter')
  assert.equal(state.selected, 'letter')
  assert.equal(isCraftSurpriseComplete(state), false)
})

test('confirmation needs a choice and then locks the surprise', () => {
  let state = createCraftSurpriseState()

  assert.equal(confirmCraftSurprise(state), state, 'nothing is confirmed without a choice')

  state = selectCraftSurprise(state, 'craft')
  state = confirmCraftSurprise(state)

  assert.equal(state.confirmed, true)
  assert.equal(isCraftSurpriseComplete(state), true)
  assert.equal(selectCraftSurprise(state, 'drawing'), state, 'confirmed choice is locked')
  assert.equal(confirmCraftSurprise(state), state)
})
