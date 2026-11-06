import { expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

const session = async () => {
  const browser = createChrome({ userId: '1', webToken: { userId: '1', accessToken: 'synthetic', expires: Number.MAX_SAFE_INTEGER, error: null } })
  const { startSessionService } = await import('../../packages/service-worker/src/session')
  startSessionService()
  vi.resetModules()
  return browser
}
const uploaded = { hash: 'synthetic-upload-hash', sha: 'synthetic-sha', secret: 'synthetic-secret', meta: {} }
const saved = { hash: 'synthetic-save-hash', photo: { photo_300: 'https://images.invalid/cover.png' } }

it('stages an upload and attaches its saved cover through the observed two-step API', async () => {
  await session()
  const network = vi.fn(async (url: string, _init?: RequestInit) => {
    if (url.includes('getAudioPlaylistCoverUploadServer')) return Response.json({ response: { upload_url: 'https://pu.vk.ru/synthetic-upload' } })
    if (url.startsWith('https://pu.vk.ru/')) return Response.json(uploaded)
    return Response.json({ response: url.includes('saveAudioPlaylistCover') ? saved : saved.photo })
  })
  vi.stubGlobal('fetch', network)
  const { vkPlaylistCover } = await import('@vk-audiopad/common')
  const cover = await vkPlaylistCover.upload('1', new Blob(['synthetic-image'], { type: 'image/png' }))
  expect(network.mock.calls[1][1]?.body).toBeInstanceOf(FormData)
  await vkPlaylistCover.save('1', '10', cover)
  expect(network.mock.calls.map(([url]) => new URL(url).pathname)).toEqual(['/method/photos.getAudioPlaylistCoverUploadServer', '/synthetic-upload', '/method/photos.saveAudioPlaylistCover', '/method/audio.setPlaylistCoverPhoto'])
  expect(Object.fromEntries(new URLSearchParams(String(network.mock.calls[3][1]?.body)))).toMatchObject({ playlist_owner_id: '1', playlist_id: '10', hash: 'synthetic-save-hash', photo: JSON.stringify(saved.photo) })
})

it('rejects a staged cover after session retirement without dispatching a save', async () => {
  const browser = await session()
  const network = vi.fn(async (url: string) => Response.json(url.includes('getAudioPlaylistCoverUploadServer') ? { response: { upload_url: 'https://pu.vk.ru/synthetic-upload' } } : uploaded))
  vi.stubGlobal('fetch', network)
  const { vkPlaylistCover } = await import('@vk-audiopad/common')
  const cover = await vkPlaylistCover.upload('1', new Blob(['synthetic-image'], { type: 'image/png' }))
  await browser.api.storage.local.set({ sessionEpoch: 'retired-cover' })
  await expect(vkPlaylistCover.save('1', '10', cover)).rejects.toMatchObject({ kind: 'session-changed' })
  expect(network).toHaveBeenCalledTimes(2)
})

it('reuses a saved photo when attachment fails instead of creating another photo', async () => {
  await session()
  let attachments = 0
  const network = vi.fn(async (url: string) => {
    if (url.includes('saveAudioPlaylistCover')) return Response.json({ response: saved })
    if (++attachments === 1) throw new Error('synthetic-private-value')
    return Response.json({ response: saved.photo })
  })
  vi.stubGlobal('fetch', network)
  const { vkPlaylistCover } = await import('@vk-audiopad/common')
  const cover = { identity: { userId: '1', epoch: 'legacy' }, payload: uploaded }
  await expect(vkPlaylistCover.save('1', '10', cover)).rejects.toThrow('network')
  await vkPlaylistCover.save('1', '10', cover)
  expect(network.mock.calls.filter(([url]) => url.includes('saveAudioPlaylistCover'))).toHaveLength(1)
  expect(network.mock.calls.filter(([url]) => url.includes('setPlaylistCoverPhoto'))).toHaveLength(2)
})

it('rejects unsupported files and upload destinations before sending image bytes', async () => {
  await session()
  const network = vi.fn(async () => Response.json({ response: { upload_url: 'https://outside.invalid/upload' } }))
  vi.stubGlobal('fetch', network)
  const { vkPlaylistCover } = await import('@vk-audiopad/common')
  await expect(vkPlaylistCover.upload('1', new Blob(['bad'], { type: 'text/plain' }))).rejects.toThrow('format')
  expect(network).not.toHaveBeenCalled()
  await expect(vkPlaylistCover.upload('1', new Blob(['image'], { type: 'image/png' }))).rejects.toThrow('format')
  expect(network).toHaveBeenCalledOnce()
})

it('rejects an upload that completes after its session was retired', async () => {
  const browser = await session()
  const network = controlledFetch()
  const { vkPlaylistCover } = await import('@vk-audiopad/common')
  const pending = vkPlaylistCover.upload('1', new Blob(['image'], { type: 'image/png' }))
  const rejected = expect(pending).rejects.toMatchObject({ kind: 'session-changed' })
  await vi.waitFor(() => { expect(network.requests).toHaveLength(1) })
  network.requests[0].resolve(Response.json({ response: { upload_url: 'https://pu.vk.ru/synthetic-upload' } }))
  await vi.waitFor(() => { expect(network.requests).toHaveLength(2) })
  await browser.api.storage.local.set({ sessionEpoch: 'retired-upload' })
  network.requests[1].resolve(Response.json(uploaded))
  await rejected
  expect(network.requests).toHaveLength(2)
})
