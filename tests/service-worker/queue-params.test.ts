import { expect, it } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { controlledFetch } from '../helpers/fetch'

it('sends owner and audio identifiers in their defined order', async () => {
  createChrome()
  const network = controlledFetch()
  const { fetchQueueParams } = await import('../../packages/service-worker/src/fetchers/queue-params')
  const { toTrackItemFromAPIResponse } = await import('../../packages/common/src/converter')
  const track = toTrackItemFromAPIResponse({
    response: [{
      owner_id: -456,
      id: 123,
      access_key: '',
      url: '',
      thumb: { photo_68: '' },
      artist: 'Artist',
      main_artists: [],
      title: 'Track',
      duration: 1,
      track_code: ''
    }]
  })
  const request = fetchQueueParams({ ...track, urlHash: 'synthetic' })
  expect(network.requests).toHaveLength(1)
  expect(network.requests[0].url).toBe('https://vk.ru/al_audio.php?act=queue_params')
  const body = network.requests[0].init?.body as FormData
  expect(body.get('owner_id')).toBe('-456')
  expect(body.get('audio_id')).toBe('123')
  expect(body.get('hash')).toBe('synthetic')
  network.requests[0].resolve(new Response('{}'))
  await request
})

it('propagates a network failure instead of completing the request successfully', async () => {
  const network = controlledFetch()
  const { request } = await import('../../packages/common/src/vk-client')
  const pending = request('https://vk.ru/al_audio.php?act=queue_params', { audio_id: '123' })
  const failure = expect(pending).rejects.toThrow('Offline')
  network.requests[0].reject(new Error('Offline'))
  await failure
})
