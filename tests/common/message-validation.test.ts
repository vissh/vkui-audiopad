import { expect, it } from 'vitest'
import { isPlayerCommand, isRuntimeMessage, isTrustedSender } from '../../packages/common/src/message-validation'
import { MessageTarget, MessageType } from '../../packages/common/src/types'
import { createChrome } from '../helpers/chrome'
import { playlist, track } from '../helpers/playback'

it('validates nested playlist and queue input instead of trusting static types', () => {
  const message = { target: MessageTarget.SERVICE_WORKER, type: MessageType.ACTIVE_TRACK, trackId: '1_1', playlist: playlist(['1_1']) }
  expect(isPlayerCommand(message)).toBe(true)
  expect(isPlayerCommand({ ...message, playlist: { ...message.playlist, tracks: [{ ...track('1_1'), duration: NaN }] } })).toBe(false)
  expect(isPlayerCommand({ ...message, playlist: { ...message.playlist, tracks: [null] } })).toBe(false)
  expect(isPlayerCommand({ ...message, playlist: { ...message.playlist, isVkMix: 'true' } })).toBe(false)
})

it.each([null, [], {}, { target: 'service-worker', type: 'unknown' }, { target: 'offscreen', type: 'change-volume', value: 2 }, { target: 'offscreen', type: 'change-current-time', value: -1 }, { target: 'service-worker', type: 'current-time', value: Infinity }, { target: 'service-worker', type: 'play-or-pause', played: 'false' }])('rejects malformed input %#', input => {
  expect(isRuntimeMessage(input)).toBe(false)
})

it('requires finite observed media times and a recognized status', () => {
  const message = { target: MessageTarget.SERVICE_WORKER, type: MessageType.AUDIO_PLAYER_TIMEUPDATED, playbackId: 'source', paused: false, currentTime: 3, duration: 30 }
  expect(isRuntimeMessage(message)).toBe(true)
  expect(isRuntimeMessage({ ...message, duration: NaN })).toBe(false)
  expect(isRuntimeMessage({ target: MessageTarget.SERVICE_WORKER, type: MessageType.EQUALIZER_STATUS, playbackId: null, status: 'unknown' })).toBe(false)
})

it('does not downgrade malformed request metadata to a one-way command', () => {
  const command = { target: MessageTarget.SERVICE_WORKER, type: MessageType.REPEAT }
  expect(isPlayerCommand(command)).toBe(true)
  for (const metadata of [{ requestId: '' }, { requestId: 1, expiresAt: 1000 }, { requestId: 'id' }, { expiresAt: 1000 }]) {
    expect(isRuntimeMessage({ ...command, ...metadata })).toBe(false)
  }
})

it('compares parsed extension scheme and host, including Firefox opaque URL origins', () => {
  const browser = createChrome()
  expect(isTrustedSender({ id: browser.api.runtime.id, url: browser.api.runtime.getURL('index.html') })).toBe(true)
  for (const url of ['https://test-extension/index.html', 'chrome-extension://test-extension.evil/index.html', 'not a URL']) {
    expect(isTrustedSender({ id: browser.api.runtime.id, url })).toBe(false)
  }
  expect(isTrustedSender({ id: 'other', url: browser.api.runtime.getURL('index.html') })).toBe(false)
  browser.api.runtime.getURL = path => `moz-extension://a-uuid/${path}`
  expect(isTrustedSender({ id: browser.api.runtime.id, url: 'moz-extension://a-uuid/offscreen.html' })).toBe(true)
})
