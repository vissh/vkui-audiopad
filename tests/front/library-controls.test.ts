// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { commonTypes } from '@vk-audiopad/common'
import { createChrome } from '../helpers/chrome'
import { deferred } from '../helpers/deferred'
import { playlist, track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const setup = async () => {
  const browser = createChrome({ userId: '1' })
  browser.api.runtime.onMessage.addListener(() => {})
  const network = vi.fn(async () => new Response('{"payload":[0,[]]}'))
  vi.stubGlobal('fetch', network)
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { Track } = await import('../../packages/front/src/widgets/track-list/ui/Track')
  const { Notification } = await import('@/shared/ui/notification')
  const { deletedTrackForRestore } = await import('@/features/restore')
  const { setActiveTab } = await import('@/shared/model')
  const view = render(createElement(ConfigProvider, {
    platform: Platform.ANDROID,
    children: createElement(AdaptivityProvider, {}, createElement(Track, { playlist: playlist(['1_1']), track: track('1_1') }), createElement(Notification))
  }))
  await screen.findByRole('button', { name: 'Удалить из моей музыки' })
  return { ...browser, network, pending: deletedTrackForRestore, setActiveTab, view }
}

it('keeps a muted row with an enabled restore button and restores without playing or removing the queue item', async () => {
  const browser = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Удалить из моей музыки' }))
  const restore = await screen.findByRole('button', { name: 'Восстановить аудиозапись' })
  expect(restore.hasAttribute('disabled')).toBe(false)
  expect(restore.closest('.vkap_track_cell_removed')).not.toBeNull()
  fireEvent.click(restore)
  await screen.findByRole('button', { name: 'Удалить из моей музыки' })
  expect(document.querySelector('.vkap_track_cell_removed')).toBeNull()
  expect(browser.network).toHaveBeenCalledTimes(2)
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
  browser.pending.clear()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it('disables duplicate delete requests and only marks success after the response', async () => {
  const browser = await setup()
  const response = deferred<Response>()
  browser.network.mockReturnValueOnce(response.promise)
  const button = screen.getByRole('button', { name: 'Удалить из моей музыки' })
  act(() => { fireEvent.click(button); fireEvent.click(button) })
  expect(button.getAttribute('aria-disabled')).toBe('true')
  expect(button.getAttribute('aria-busy')).toBe('true')
  expect(browser.network).toHaveBeenCalledOnce()
  expect(screen.queryByRole('button', { name: 'Восстановить аудиозапись' })).toBeNull()
  await act(async () => { response.resolve(new Response('{"payload":[0,[]]}')) })
  await screen.findByRole('button', { name: 'Восстановить аудиозапись' })
})

it('reports delete rejection safely without showing a restore action or changing the queue', async () => {
  const browser = await setup()
  browser.network.mockResolvedValueOnce(new Response('{"payload":[1,["synthetic-private-value"]]}'))
  fireEvent.click(screen.getByRole('button', { name: 'Удалить из моей музыки' }))
  await screen.findByText('Не удалось удалить аудиозапись. Проверьте библиотеку VK перед повторной попыткой.')
  expect(screen.queryByText(/synthetic-private/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Восстановить аудиозапись' })).toBeNull()
  browser.pending.clear()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it('removes a deleted row from the queue on tab change, including a late delete response', async () => {
  const browser = await setup()
  const response = deferred<Response>()
  browser.network.mockReturnValueOnce(response.promise)
  fireEvent.click(screen.getByRole('button', { name: 'Удалить из моей музыки' }))
  act(() => { browser.setActiveTab({ tab: commonTypes.ContentTab.EXPLORE }) })
  await act(async () => { response.resolve(new Response('{"payload":[0,[]]}')) })
  await waitFor(() => { expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce() })
  expect(screen.queryByRole('button', { name: 'Восстановить аудиозапись' })).toBeNull()
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ type: commonTypes.MessageType.DELETE_TRACK, track: expect.objectContaining({ id: '1_1' }) }))
})

it('keeps the restore action after a failed restore and finishes queue removal on navigation', async () => {
  const browser = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Удалить из моей музыки' }))
  const restore = await screen.findByRole('button', { name: 'Восстановить аудиозапись' })
  browser.network.mockRejectedValueOnce(new Error('synthetic-private-value'))
  fireEvent.click(restore)
  await screen.findByText('Не удалось восстановить аудиозапись. Проверьте библиотеку VK перед повторной попыткой.')
  expect(screen.getByRole('button', { name: 'Восстановить аудиозапись' }).hasAttribute('disabled')).toBe(false)
  act(() => { browser.setActiveTab({ tab: commonTypes.ContentTab.EXPLORE }) })
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledOnce()
})

it('does not remove the queued track when the popup UI closes', async () => {
  const browser = await setup()
  fireEvent.click(screen.getByRole('button', { name: 'Удалить из моей музыки' }))
  await screen.findByRole('button', { name: 'Восстановить аудиозапись' })
  browser.view.unmount()
  await waitFor(() => { expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled() })
})
