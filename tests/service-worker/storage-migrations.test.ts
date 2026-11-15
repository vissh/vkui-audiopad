import { expect, it } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { playlist, track } from '../helpers/playback'

it('preserves a complete queue, settings and session across legacy upgrade and repeated migration', async () => {
  const saved = { volume: 0.7, userId: '1', sessionEpoch: 'one', webToken: { synthetic: true }, currentPlaylist: playlist(['1_1']), activeTrack: track('1_1'), audiosIds: [['1_1', 'key'], ['1_2', 'unloaded']], originalAudiosIds: [['1_2', 'unloaded'], ['1_1', 'key']], activeTrackIndex: 99, currentTime: 12, playbackRequested: false }
  const browser = createChrome(saved)
  const { migrateStoredState } = await import('../../packages/service-worker/src/storage-migrations')
  await migrateStoredState()
  const migrated = { ...saved, schemaVersion: 1, activeTrackIndex: 0 }
  expect(browser.snapshot()).toEqual(migrated)
  browser.api.storage.local.set.mockClear()
  await migrateStoredState()
  expect(browser.snapshot()).toEqual(migrated)
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('repairs malformed legacy playback data while retaining unrelated settings and session', async () => {
  const browser = createChrome({ volume: NaN, repeat: '1', userId: '1', equalizer: { enabled: false }, currentPlaylist: { tracks: [null] }, audiosIds: 'bad', played: true, playbackRequested: true, playbackId: 'old' })
  const { migrateStoredState } = await import('../../packages/service-worker/src/storage-migrations')
  await migrateStoredState()
  expect(browser.snapshot()).toMatchObject({ schemaVersion: 1, volume: 0.5, repeat: 0, userId: '1', equalizer: { enabled: false }, currentPlaylist: null, audiosIds: [], played: false, playbackRequested: false, playbackId: null })
})

it('leaves failed writes unversioned and retries without losing the queue', async () => {
  const saved = { currentPlaylist: playlist(['1_1']), audiosIds: [['1_1', '']] }
  const browser = createChrome(saved)
  const { migrateStoredState } = await import('../../packages/service-worker/src/storage-migrations')
  browser.api.storage.local.set.mockRejectedValueOnce(new Error('Quota exceeded'))
  await expect(migrateStoredState()).rejects.toThrow('Quota exceeded')
  expect(browser.snapshot()).toEqual(saved)
  await migrateStoredState()
  expect(browser.snapshot()).toEqual({ ...saved, schemaVersion: 1 })
})

it.each([2, -1, '1', 0.5])('rejects unsupported schema %j without modifying stored data', async schemaVersion => {
  const saved = { schemaVersion, currentPlaylist: playlist(['1_1']) }
  const browser = createChrome(saved)
  const { migrateStoredState } = await import('../../packages/service-worker/src/storage-migrations')
  await expect(migrateStoredState()).rejects.toThrow('Unsupported stored state version')
  expect(browser.snapshot()).toEqual(saved)
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
})

it('updates a valid queue without autoplay and still clears account data on logout', async () => {
  const saved = { currentPlaylist: playlist(['1_1']), audiosIds: [['1_1', '']], userId: '1', currentTime: 12, volume: 0.7 }
  const browser = createChrome(saved)
  Object.assign(browser.api.runtime, { getManifest: () => ({ version: '3.4.1' }) })
  const { startListeningOnInstalled } = await import('../../packages/service-worker/src/listeners/install')
  startListeningOnInstalled()
  browser.api.runtime.onInstalled.emit({ reason: 'update', previousVersion: '3.4.0' } as chrome.runtime.InstalledDetails)
  const { migrateStoredState } = await import('../../packages/service-worker/src/storage-migrations')
  await migrateStoredState()
  expect(browser.snapshot()).toEqual({ ...saved, schemaVersion: 1 })
  expect(browser.api.offscreen.createDocument).not.toHaveBeenCalled()
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.clearStorage()
  expect(browser.snapshot()).toEqual({ volume: 0.7, schemaVersion: 1 })
})
