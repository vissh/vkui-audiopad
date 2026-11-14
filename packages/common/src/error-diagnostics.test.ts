import { expect, it } from 'vitest'
import { describeError } from './error-diagnostics'
import { readVKApiError, requestOperation, VKApiError } from './vk-api-error'

it('reports only approved diagnostic fields even for serialized errors', () => {
  const error = describeError({ kind: 'format', name: 'private-name', message: 'private-message', cause: 'private-cause', status: 200, code: 5, operation: 'section', stage: 'retry', attempt: 2, contentType: 'html', redirected: true, request: 'private-request', stack: 'Error: private-message\n at secret (chrome-extension://some-id/assets/index-AbCd.js:9:42)\n at https://vk.ru/?token=private-url' })
  expect(error).toEqual({ name: 'VKApiError', message: 'VK request failed (format)', kind: 'format', status: 200, code: 5, operation: 'section', stage: 'retry', attempt: 2, contentType: 'html', redirected: true, stack: 'assets/index-AbCd.js:9:42' })
  expect(JSON.stringify(error)).not.toContain('private')
})

it('does not copy arbitrary thrown values, nested errors or unknown metadata', () => {
  expect(describeError(new TypeError('private-message'))).toMatchObject({ name: 'TypeError', message: 'Unexpected application error' })
  expect(JSON.stringify(describeError({ kind: 'network', operation: 'private-operation', contentType: 'private-type', stage: 'private-stage', attempt: 999, status: -1, code: 'private-code' }))).not.toContain('private')
  expect(describeError('private-string')).toEqual({ name: 'Error', message: 'Unexpected application error' })
  expect(readVKApiError({ kind: 'private-kind' })).toBeUndefined()
  expect(describeError(new VKApiError('timeout', { operation: 'audio.get', stage: 'request' }))).toMatchObject({ kind: 'timeout', operation: 'audio.get', stage: 'request' })
})

it('identifies known operations without retaining personal URL components', () => {
  expect(requestOperation('https://vk.ru/al_audio.php?act=section&q=private')).toBe('section')
  expect(requestOperation('https://api.vk.ru/method/audio.get?access_token=private')).toBe('audio.get')
  expect(requestOperation('https://login.vk.ru/?act=web_token')).toBe('web_token')
  expect(requestOperation('https://private.example/method/audio.get')).toBe('unknown')
  expect(requestOperation('https://vk.ru/private-path?act=section')).toBe('unknown')
  expect(requestOperation('https://api.vk.ru/method/private_method')).toBe('unknown')
})
