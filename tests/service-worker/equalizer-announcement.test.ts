import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

it.each([
  ['update', '3.3.9', '3.3.10', true],
  ['update', '3.3.9', '3.3.11', true],
  ['update', '2.9.99', '4.0.0', true],
  ['update', '3.3.10', '3.3.11', false],
  ['update', '3.4.0', '4.0.0', false],
  ['update', '3.3.8', '3.3.9', false],
  ['install', undefined, '3.3.10', false]
])('remembers first EQ availability for %s %s -> %s', async (reason, previousVersion, version, expected) => {
  const browser = createChrome({ equalizer: { enabled: false }, currentTime: 17 })
  Object.assign(browser.api.runtime, { getManifest: () => ({ version }) })
  const { startListeningOnInstalled } = await import('../../packages/service-worker/src/listeners/install')
  startListeningOnInstalled()
  browser.api.runtime.onInstalled.emit({ reason, previousVersion } as chrome.runtime.InstalledDetails)
  if (reason === 'update') await vi.waitFor(() => { expect(browser.snapshot().currentTime).toBeUndefined() })
  if (expected) await vi.waitFor(() => { expect(browser.snapshot().equalizerAnnouncementPending).toBe(true) })
  else expect(browser.snapshot().equalizerAnnouncementPending).toBeUndefined()
  expect(browser.snapshot().equalizer).toEqual({ enabled: false })
})

it('preserves an unseen announcement across later updates and does not recreate a consumed one', async () => {
  const browser = createChrome({ equalizerAnnouncementPending: true, currentTime: 10 })
  Object.assign(browser.api.runtime, { getManifest: () => ({ version: '4.0.0' }) })
  const { startListeningOnInstalled } = await import('../../packages/service-worker/src/listeners/install')
  startListeningOnInstalled()
  browser.api.runtime.onInstalled.emit({ reason: 'update', previousVersion: '3.3.10' } as chrome.runtime.InstalledDetails)
  await vi.waitFor(() => { expect(browser.snapshot().currentTime).toBeUndefined() })
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(true)
  await browser.api.storage.local.set({ equalizerAnnouncementPending: false, currentTime: 20 })
  browser.api.runtime.onInstalled.emit({ reason: 'update', previousVersion: '3.3.11' } as chrome.runtime.InstalledDetails)
  await vi.waitFor(() => { expect(browser.snapshot().currentTime).toBeUndefined() })
  expect(browser.snapshot().equalizerAnnouncementPending).toBe(false)
})
