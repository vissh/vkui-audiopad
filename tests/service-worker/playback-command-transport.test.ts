// @vitest-environment jsdom
import { commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'

afterEach(clearPlaybackMocks)

it.each([true, false])('shares toggle intent across runtime, hotkeys and background bridge with offscreen=%s', async offscreen => {
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']), playbackId: 'media', currentTime: 12 })
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ 'offscreen-document-support': offscreen }))))
  const { startListeningMessages } = await import('../../packages/service-worker/src/listeners/messages')
  const { startListeningCommandEvents } = await import('../../packages/service-worker/src/listeners/command')
  const { commonUtils } = await import('@vk-audiopad/common')
  const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
  await startListeningMessages(immediateReadiness, offscreen)
  startListeningCommandEvents(immediateReadiness)
  const message: commonTypes.TogglePlaybackMessage = { target: commonTypes.MessageTarget.SERVICE_WORKER, type: commonTypes.MessageType.TOGGLE_PLAYBACK }
  await player.api.runtime.sendMessage(message)
  await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: true }) })
  player.api.commands.onCommand.emit('010-play-pause')
  await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: false }) })
  if (offscreen) {
    await player.api.runtime.sendMessage(message)
  } else {
    commonUtils.sendBackgroundMessage(message)
  }
  await vi.waitFor(() => { expect(player.snapshot()).toMatchObject({ playbackRequested: true }) })
  expect(player.snapshot()).toMatchObject({ played: false, currentTime: 12, playbackId: 'media' })
  expect(player.fetchTrack).not.toHaveBeenCalled()
})
