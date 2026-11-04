import { commonTypes } from '@vk-audiopad/common'
import { afterEach, expect, it, vi } from 'vitest'
import { deferred } from '../helpers/deferred'
import { answerSnapshots, snapshot } from '../helpers/offscreen'
import { clearPlaybackMocks, playbackHarness, playlist, track } from '../helpers/playback'

afterEach(clearPlaybackMocks)

const setup = async () => {
  const player = await playbackHarness({ activeTrack: track('1_1'), currentPlaylist: playlist(['1_1']), playbackId: 'media', currentTime: 12 }, { realTransport: true })
  vi.stubGlobal('fetch', vi.fn(async () => new Response('{"offscreen-document-support":true}')))
  await player.api.offscreen.createDocument({})
  player.api.offscreen.createDocument.mockClear()
  let current = snapshot({ documentId: 'old-document', playbackId: 'media', hasSource: true, idle: true, currentTime: 12 })
  let beforeSnapshot = async (): Promise<void> => {}
  const commands: commonTypes.OffscreenMessage[] = []
  answerSnapshots(player, async () => {
    await beforeSnapshot()
    return { ...current }
  })
  player.api.runtime.onMessage.addListener((input: unknown) => {
    const message = input as commonTypes.Message
    if (message.target !== commonTypes.MessageTarget.OFFSCREEN || message.type === commonTypes.MessageType.GET_PLAYER_SNAPSHOT) return
    commands.push(message)
    current.activityRevision++
    current.idle = false
    if (message.type === commonTypes.MessageType.PLAY_TRACK) Object.assign(current, { playbackId: message.playbackId, hasSource: true, requested: true, paused: false, playing: true })
    if (message.type === commonTypes.MessageType.PLAY_OR_PAUSE) Object.assign(current, { requested: message.played, paused: !message.played, playing: message.played })
  })
  const create = player.api.offscreen.createDocument.getMockImplementation()!
  player.api.offscreen.createDocument.mockImplementation(async options => {
    await create(options)
    current = snapshot({ documentId: 'new-document' })
  })
  const request: commonTypes.CloseOffscreenDocumentMessage = {
    target: commonTypes.MessageTarget.SERVICE_WORKER,
    type: commonTypes.MessageType.CLOSE_OFFSCREEN_DOCUMENT,
    documentId: current.documentId,
    playbackId: current.playbackId,
    activityRevision: current.activityRevision
  }
  const { closeOffscreenDocument, isOffscreenClosing } = await import('../../packages/service-worker/src/offscreen/setup')
  const { onPlayed } = await import('../../packages/service-worker/src/actions/play-or-pause')
  return { ...player, request, commands, onPlayed, closeOffscreenDocument, isOffscreenClosing, setBeforeSnapshot: (action: () => Promise<void>) => { beforeSnapshot = action }, setSnapshot: (changes: Partial<commonTypes.PlayerSnapshot>) => { Object.assign(current, changes) } }
}

it('closes confirmed idle media and clears only its runtime identity', async () => {
  const player = await setup()
  await player.closeOffscreenDocument(player.request)
  expect(player.api.offscreen.closeDocument).toHaveBeenCalledOnce()
  expect(player.snapshot()).toMatchObject({ playbackId: null, played: false, playbackRequested: false, activeTrack: { id: '1_1' }, currentTime: 12 })
})

it('rejects an old idle request after resume and pause of the same source', async () => {
  const player = await setup()
  await player.onPlayed(true)
  await player.onPlayed(false)
  await player.closeOffscreenDocument(player.request)
  expect(player.api.offscreen.closeDocument).not.toHaveBeenCalled()
  expect(player.snapshot().playbackId).toBe('media')
})

it('rejects an idle request from a different document even with the same source id', async () => {
  const player = await setup()
  player.setSnapshot({ documentId: 'new-document' })
  await player.closeOffscreenDocument(player.request)
  expect(player.api.offscreen.closeDocument).not.toHaveBeenCalled()
})

it('does not reclaim a source with pending offscreen play even when SW intent is stale', async () => {
  const player = await setup()
  player.setSnapshot({ requested: true, paused: true })
  await player.closeOffscreenDocument(player.request)
  expect(player.api.offscreen.closeDocument).not.toHaveBeenCalled()
})

it('rechecks intent after querying idle media and lets a concurrent resume win', async () => {
  const player = await setup()
  const queried = deferred<void>()
  const release = deferred<void>()
  player.setBeforeSnapshot(async () => { queried.resolve(); await release.promise })
  const closing = player.closeOffscreenDocument(player.request)
  await queried.promise
  const resuming = player.onPlayed(true)
  release.resolve()
  await Promise.all([closing, resuming])
  expect(player.api.offscreen.closeDocument).not.toHaveBeenCalled()
  expect(player.commands).toEqual([expect.objectContaining({ type: commonTypes.MessageType.PLAY_OR_PAUSE, played: true })])
  expect(player.snapshot()).toMatchObject({ playbackId: 'media', playbackRequested: true })
})

it('waits for an already-issued close, creates a new document and reloads the selected source on resume', async () => {
  const player = await setup()
  const release = deferred<void>()
  const close = player.api.offscreen.closeDocument.getMockImplementation()!
  player.api.offscreen.closeDocument.mockImplementationOnce(async () => {
    await release.promise
    await close()
  })
  const closing = player.closeOffscreenDocument(player.request)
  await vi.waitFor(() => { expect(player.api.offscreen.closeDocument).toHaveBeenCalledOnce() })
  const resuming = player.onPlayed(true)
  await vi.waitFor(() => { expect(player.fetchTrack).toHaveBeenCalledOnce() })
  expect(player.api.offscreen.createDocument).not.toHaveBeenCalled()
  expect(player.commands).toEqual([])
  release.resolve()
  await Promise.all([closing, resuming])
  expect(player.api.offscreen.createDocument).toHaveBeenCalledOnce()
  expect(player.commands).toEqual([expect.objectContaining({ type: commonTypes.MessageType.PLAY_TRACK, url: track('1_1').url })])
  expect(player.snapshot()).toMatchObject({ playbackRequested: true, playbackError: null, activeTrack: { id: '1_1' } })
  expect(player.snapshot().playbackId).not.toBe('media')
  expect(player.isOffscreenClosing()).toBe(false)
})

it('retains a usable document and releases the lifecycle queue after a failed close', async () => {
  const player = await setup()
  player.api.offscreen.closeDocument.mockRejectedValueOnce(new Error('Close failed'))
  await expect(player.closeOffscreenDocument(player.request)).rejects.toThrow('Close failed')
  expect(player.isOffscreenClosing()).toBe(false)
  await player.onPlayed(true)
  expect(player.api.offscreen.createDocument).not.toHaveBeenCalled()
  expect(player.commands).toEqual([expect.objectContaining({ type: commonTypes.MessageType.PLAY_OR_PAUSE, played: true })])
})

it('does not close when a non-playback media command arrives while idle confirmation is pending', async () => {
  const player = await setup()
  const queried = deferred<void>()
  const release = deferred<void>()
  player.setBeforeSnapshot(async () => { queried.resolve(); await release.promise })
  const closing = player.closeOffscreenDocument(player.request)
  await queried.promise
  const { updateVolume } = await import('../../packages/service-worker/src/offscreen/update-volume')
  const changing = updateVolume(0.3)
  release.resolve()
  await Promise.all([closing, changing])
  expect(player.api.offscreen.closeDocument).not.toHaveBeenCalled()
  expect(player.commands).toEqual([expect.objectContaining({ type: commonTypes.MessageType.CHANGE_VOLUME, value: 0.3 })])
})
