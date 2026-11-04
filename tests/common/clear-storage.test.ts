import { expect, it } from 'vitest'
import { createChrome } from '../helpers/chrome'

it('awaits cleanup and preserves settings and explicitly retained session fields', async () => {
  const browser = createChrome({ volume: 0.4, shuffle: true, userId: '1', webToken: 'synthetic', currentPlaylist: {}, playbackId: 'media' })
  const { commonUtils } = await import('@vk-audiopad/common')
  await commonUtils.clearStorage(['userId', 'webToken'])
  expect(browser.snapshot()).toEqual({ volume: 0.4, shuffle: true, userId: '1', webToken: 'synthetic' })
})

it('does not remove data after a failed read and surfaces the failure', async () => {
  const browser = createChrome({ userId: '1' })
  browser.failNextStorageOperation('Read failed')
  const { commonUtils } = await import('@vk-audiopad/common')
  await expect(commonUtils.clearStorage()).rejects.toThrow('Read failed')
  expect(browser.api.storage.local.remove).not.toHaveBeenCalled()
  expect(browser.snapshot()).toEqual({ userId: '1' })
})
