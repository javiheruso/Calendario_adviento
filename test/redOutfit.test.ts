import { test } from 'node:test'
import { strict as assert } from 'node:assert'
import {
  RED_OUTFIT_ITEM_IDS,
  checkedRedOutfitItems,
  createRedOutfitState,
  isRedOutfitComplete,
  toggleRedOutfitItem,
} from '../src/domain/games/redOutfit'

test('the red checklist starts empty and never completes on its own', () => {
  const state = createRedOutfitState()

  assert.equal(RED_OUTFIT_ITEM_IDS.length, 3)
  assert.equal(checkedRedOutfitItems(state), 0)
  assert.equal(isRedOutfitComplete(state), false)
})

test('each red item is toggled independently and can be unchecked', () => {
  let state = createRedOutfitState()

  state = toggleRedOutfitItem(state, 'red-garment-one')
  assert.equal(state.checked['red-garment-one'], true)
  assert.equal(checkedRedOutfitItems(state), 1)
  assert.equal(isRedOutfitComplete(state), false)

  state = toggleRedOutfitItem(state, 'red-garment-one')
  assert.equal(state.checked['red-garment-one'], false)
  assert.equal(checkedRedOutfitItems(state), 0)
})

test('the checklist completes only with two garments and one object', () => {
  let state = createRedOutfitState()

  state = toggleRedOutfitItem(state, 'red-garment-one')
  state = toggleRedOutfitItem(state, 'red-garment-two')
  assert.equal(isRedOutfitComplete(state), false)

  state = toggleRedOutfitItem(state, 'red-object')
  assert.equal(checkedRedOutfitItems(state), 3)
  assert.equal(isRedOutfitComplete(state), true)
})
