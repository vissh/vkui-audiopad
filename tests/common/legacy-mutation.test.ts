import { expect, it } from 'vitest'
import { assertMutationResponse } from '../../packages/common/src/vk-client'
import { type JSONValue } from '../../packages/common/src/types'

it.each([0, '0'])('recognizes a successful legacy mutation envelope: %s', code => {
  expect(() => { assertMutationResponse({ payload: [code, []] }) }).not.toThrow()
})

it.each<JSONValue>([null, [], 'synthetic-private-value', {}, { payload: [] }, { payload: [1, []] }, { payload: [0, false] }])('rejects an error or malformed mutation without exposing its payload: %#', payload => {
  expect(() => { assertMutationResponse(payload) }).toThrow()
  expect(() => { assertMutationResponse(payload) }).not.toThrow('synthetic-private-value')
})
