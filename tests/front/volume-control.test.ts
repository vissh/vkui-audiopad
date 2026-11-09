// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createElement, Fragment } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { installAudio } from '../helpers/audio'
import { deferred } from '../helpers/deferred'

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(cleanup)

const mount = async () => {
  const { ConfigProvider, AdaptivityProvider, Platform } = await import('@vkontakte/vkui')
  const { VolumeControl } = await import('@/features/change-volume')
  const { Notification } = await import('@/shared/ui/notification')
  return render(createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(Fragment, {}, createElement(VolumeControl), createElement(Notification)) }) }))
}

it('mutes atomically, restores the previous level and retains it after UI closure', async () => {
  const browser = createChrome({ volume: 0.37 })
  const view = await mount()
  await act(async () => { await browser.api.storage.local.get() })
  browser.api.storage.local.set.mockClear()
  fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }))
  await act(async () => { await browser.api.storage.local.get() })
  expect(browser.api.storage.local.set).toHaveBeenCalledExactlyOnceWith({ volume: 0, volumeBeforeMute: 0.37 })
  expect(screen.getByRole('button', { name: 'Включить звук' })).toBeTruthy()
  expect((screen.getByRole('slider', { name: 'Громкость' }) as HTMLInputElement).value).toBe('0')
  view.unmount()
  vi.resetModules()
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  fireEvent.click(screen.getByRole('button', { name: 'Включить звук' }))
  await act(async () => { await browser.api.storage.local.get() })
  expect(browser.snapshot()).toMatchObject({ volume: 0.37, volumeBeforeMute: 0.37 })
  expect(screen.getByRole('button', { name: 'Выключить звук' })).toBeTruthy()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
})

it('cancels a pending slider write when mute is pressed and remembers the displayed level', async () => {
  const browser = createChrome({ volume: 0.5 })
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  vi.useFakeTimers()
  fireEvent.change(screen.getByRole('slider', { name: 'Громкость' }), { target: { value: '49' } })
  expect((screen.getByRole('slider', { name: 'Громкость' }) as HTMLInputElement).value).toBe('49')
  fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(browser.snapshot()).toMatchObject({ volume: 0, volumeBeforeMute: 0.49 })
  fireEvent.click(screen.getByRole('button', { name: 'Включить звук' }))
  await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(browser.snapshot()).toMatchObject({ volume: 0.49, volumeBeforeMute: 0.49 })
})

it('unmutes through the slider and follows external volume updates', async () => {
  const browser = createChrome({ volume: 0, volumeBeforeMute: 0.37 })
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  vi.useFakeTimers()
  fireEvent.change(screen.getByRole('slider', { name: 'Громкость' }), { target: { value: '1' } })
  await act(async () => { await vi.advanceTimersByTimeAsync(50) })
  expect(browser.snapshot()).toMatchObject({ volume: 0.01, volumeBeforeMute: 0.01 })
  expect(screen.getByRole('button', { name: 'Выключить звук' })).toBeTruthy()
  await act(async () => { await browser.api.storage.local.set({ volume: 0.75 }) })
  expect((screen.getByRole('slider', { name: 'Громкость' }) as HTMLInputElement).value).toBe('75')
})

it.each([0.5, 0.37])('retains the chosen volume before storage events with remembered level %s', async remembered => {
  const browser = createChrome({ volume: 0.37, volumeBeforeMute: remembered })
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }))
  fireEvent.click(screen.getByRole('button', { name: 'Включить звук' }))
  await act(async () => { await browser.api.storage.local.get() })
  expect(browser.snapshot()).toMatchObject({ volume: 0.37, volumeBeforeMute: 0.37 })
})

it('keeps the latest unmute intent visible while its write waits behind a mute update', async () => {
  const browser = createChrome({ volume: 0.37, volumeBeforeMute: 0.37 })
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  const persist = browser.api.storage.local.set.getMockImplementation()!
  const release = deferred<void>()
  browser.api.storage.local.set.mockImplementationOnce(persist).mockImplementationOnce(async (values, callback) => {
    await release.promise
    return await persist(values, callback)
  })
  fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }))
  fireEvent.click(screen.getByRole('button', { name: 'Включить звук' }))
  await act(async () => { await browser.api.storage.local.get() })
  expect(browser.snapshot().volume).toBe(0)
  expect(screen.getByRole('button', { name: 'Выключить звук' })).toBeTruthy()
  expect((screen.getByRole('slider', { name: 'Громкость' }) as HTMLInputElement).value).toBe('37')
  await act(async () => { release.resolve() })
  expect(browser.snapshot().volume).toBe(0.37)
})

it.each([undefined, 0, -1, 2])('uses a usable restore level for legacy or invalid remembered volume %s', async remembered => {
  const browser = createChrome({ volume: 0, volumeBeforeMute: remembered })
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  fireEvent.click(screen.getByRole('button', { name: 'Включить звук' }))
  await act(async () => { await browser.api.storage.local.get() })
  expect(browser.snapshot()).toMatchObject({ volume: 0.5, volumeBeforeMute: 0.5 })
})

it('reports a failed volume write and returns to the observed setting', async () => {
  const browser = createChrome({ volume: 0.37 })
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  browser.failNextStorageOperation('synthetic-private-value')
  fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }))
  await screen.findByText('Не удалось изменить громкость')
  expect(browser.snapshot().volume).toBe(0.37)
  expect(screen.getByRole('button', { name: 'Выключить звук' })).toBeTruthy()
  expect(document.body.textContent).not.toContain('synthetic-private-value')
})

it('cancels an uncommitted slider change when the UI closes', async () => {
  const browser = createChrome({ volume: 0.5 })
  const view = await mount()
  await act(async () => { await browser.api.storage.local.get() })
  vi.useFakeTimers()
  browser.api.storage.local.set.mockClear()
  fireEvent.change(screen.getByRole('slider', { name: 'Громкость' }), { target: { value: '49' } })
  view.unmount()
  await act(async () => { await vi.advanceTimersByTimeAsync(100) })
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  expect(browser.snapshot().volume).toBe(0.5)
})

it.each([true, false])('applies mute and restore to Audio through storage and the offscreen=%s transport', async offscreen => {
  const browser = createChrome({ volume: 0.37, played: true })
  document.body.replaceChildren(Object.assign(document.createElement('div'), { id: 'custom-events' }))
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ 'offscreen-document-support': offscreen })))
  browser.api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'offscreen.html' }])
  const audios = installAudio()
  const { audioElement } = await import('../../packages/offscreen/src/audio-element')
  Object.assign(audioElement, { volume: 0.37, paused: false, currentTime: 12, duration: 30, src: 'https://audio.invalid/source.mp3' })
  const { startListeningMessages } = await import('../../packages/offscreen/src/listeners/messages')
  startListeningMessages()
  const { immediateReadiness } = await import('../../packages/service-worker/src/readiness')
  const { startListeningStorageEvents } = await import('../../packages/service-worker/src/listeners/storage')
  startListeningStorageEvents(immediateReadiness)
  await mount()
  await act(async () => { await browser.api.storage.local.get() })
  fireEvent.click(screen.getByRole('button', { name: 'Выключить звук' }))
  await waitFor(() => { expect(audioElement.volume).toBe(0) })
  fireEvent.click(screen.getByRole('button', { name: 'Включить звук' }))
  await waitFor(() => { expect(audioElement.volume).toBe(0.37) })
  expect(audioElement.paused).toBe(false)
  expect(audioElement.currentTime).toBe(12)
  expect(audios).toHaveLength(1)
  expect(audios[0].play).not.toHaveBeenCalled()
  expect(audios[0].pause).not.toHaveBeenCalled()
  expect(browser.snapshot().played).toBe(true)
})
