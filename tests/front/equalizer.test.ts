// @vitest-environment jsdom
import { equalizer } from '@vk-audiopad/common'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

afterEach(cleanup)
beforeEach(() => {
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((media: string) => ({
    matches: false,
    media,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: () => true
  })))
})

const renderUI = async (children: ReactNode) => {
  const { ConfigProvider, AdaptivityProvider, AppRoot, Platform } = await import('@vkontakte/vkui')
  return render(createElement(ConfigProvider, { platform: Platform.ANDROID, children: createElement(AdaptivityProvider, { children: createElement(AppRoot, { children }) }) }))
}

const choosePreset = async (name: string): Promise<void> => {
  await act(async () => { fireEvent.click(screen.getByRole('combobox', { name: 'Пресет' })) })
  await act(async () => { fireEvent.click(within(screen.getByRole('listbox')).getByRole('option', { name })) })
}

const saveAs = async (name: string): Promise<void> => {
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сохранить как…' })) })
  await act(async () => { fireEvent.change(screen.getByLabelText('Название пресета'), { target: { value: name } }) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сохранить' })) })
}

it('creates several named presets with Preamp, renames and deletes explicitly, and preserves them on reset', async () => {
  const browser = createChrome()
  const { EqualizerSettings } = await import('../../packages/front/src/entities/modal/ui/EqualizerSettings')
  await renderUI(createElement(EqualizerSettings))
  await act(async () => { await browser.api.storage.local.get('equalizer') })
  expect(screen.queryByRole('slider')).toBeNull()
  await act(async () => { fireEvent.click(screen.getByRole('switch', { name: 'Включить эквалайзер' })) })
  expect(screen.getAllByRole('slider')).toHaveLength(11)
  expect(screen.queryByRole('status')).toBeNull()
  expect(screen.queryByText('10 полос · 32 Гц — 16 кГц')).toBeNull()
  await choosePreset('Больше баса')
  const bass = screen.getByRole('slider', { name: '32 Гц' })
  expect(bass.getAttribute('aria-valuetext')).toBe('+6 дБ')
  await act(async () => { fireEvent.keyDown(bass, { key: 'ArrowUp' }) })
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe('Ручная настройка')
  await saveAs('Наушники')
  const preamp = screen.getByRole('slider', { name: 'Preamp' })
  await act(async () => { fireEvent.keyDown(preamp, { key: 'PageDown' }) })
  await saveAs('Колонки')
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets.map(item => item.name)).toEqual(['Наушники', 'Колонки'])
  await choosePreset('Наушники')
  expect(preamp.getAttribute('aria-valuenow')).toBe('0')
  await choosePreset('Колонки')
  expect(preamp.getAttribute('aria-valuenow')).toBe('-3')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Переименовать' })) })
  await act(async () => { fireEvent.change(screen.getByLabelText('Название пресета'), { target: { value: 'Наушники' } }) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сохранить' })) })
  expect(screen.getByText('Пресет с таким именем уже есть')).toBeTruthy()
  await act(async () => { fireEvent.change(screen.getByLabelText('Название пресета'), { target: { value: 'Колонки дома' } }) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сохранить' })) })
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets[1].name).toBe('Колонки дома')
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Удалить пресет' })) })
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets).toHaveLength(2)
  await act(async () => { fireEvent.click(within(screen.getByRole('group', { name: 'Удаление пресета' })).getByRole('button', { name: 'Удалить' })) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сбросить' })) })
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets.map(item => item.name)).toEqual(['Наушники'])
  expect(preamp.getAttribute('aria-valuenow')).toBe('0')
  await choosePreset('Наушники')
  expect(bass.getAttribute('aria-valuenow')).toBe('7')
  await act(async () => { fireEvent.keyDown(bass, { key: 'End' }) })
  await act(async () => { fireEvent.keyDown(bass, { key: 'ArrowRight' }) })
  expect(bass.getAttribute('aria-valuenow')).toBe('12')
  await act(async () => { await browser.api.storage.local.set({ equalizerStatus: 'unavailable' }) })
  expect(screen.getByRole('status').textContent).toContain('играет без эквалайзера')
})

it('migrates the old personal preset, retains named settings across modal reopening and keeps theme labeled', async () => {
  vi.useFakeTimers()
  const browser = createChrome({ equalizer: { enabled: true, gains: [6, 4, 0, -1, 0], savedGains: [7, 4, 0, -1, 0], savedPreamp: -3 } })
  const { AppModalRoot, setSettingsModal } = await import('@/entities/modal')
  await renderUI(createElement(AppModalRoot))
  await act(async () => { setSettingsModal(); await vi.advanceTimersByTimeAsync(1000) })
  const settings = screen.getByRole('dialog', { name: 'Настройки' })
  for (const name of ['Звук', 'Внешний вид', 'Управление']) expect(within(settings).getByRole('tab', { name })).toBeTruthy()
  await choosePreset('Мой пресет')
  expect(screen.getByRole('slider', { name: 'Preamp' }).getAttribute('aria-valuenow')).toBe('-3')
  await saveAs('Новый вариант')
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe('Новый вариант')
  await act(async () => { fireEvent.click(within(settings).getByRole('tab', { name: 'Внешний вид' })) })
  expect(within(settings).getByLabelText('Тема', { selector: 'input' })).toBeTruthy()
  await act(async () => { fireEvent.click(within(settings).getByRole('tab', { name: 'Управление' })) })
  expect(within(settings).getByRole('link', { name: 'Открыть плеер в отдельной вкладке' })).toBeTruthy()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Отмена' })); await vi.advanceTimersByTimeAsync(1000) })
  await act(async () => { setSettingsModal(); await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.getByRole('slider', { name: 'Preamp' }).getAttribute('aria-valuenow')).toBe('-3')
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe('Новый вариант')
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets.map(item => item.name)).toEqual(['Мой пресет', 'Новый вариант'])
})

it('captures a pointer drag, clamps its endpoints and ignores movement after release or bypass', async () => {
  vi.stubGlobal('PointerEvent', class extends MouseEvent {
    pointerId: number
    constructor (type: string, init: PointerEventInit = {}) {
      super(type, init)
      this.pointerId = init.pointerId ?? 1
    }
  })
  const browser = createChrome({ equalizer: { enabled: true, gains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } })
  const { EqualizerSettings } = await import('../../packages/front/src/entities/modal/ui/EqualizerSettings')
  await renderUI(createElement(EqualizerSettings))
  await act(async () => { await browser.api.storage.local.get('equalizer') })
  const slider = screen.getByRole('slider', { name: '32 Гц' })
  vi.spyOn(slider, 'getBoundingClientRect').mockReturnValue({ x: 0, y: 50, top: 50, left: 0, bottom: 206, right: 60, width: 60, height: 156, toJSON: () => ({}) })
  let captured = false
  slider.setPointerCapture = vi.fn(() => { captured = true })
  slider.hasPointerCapture = vi.fn(() => captured)
  slider.releasePointerCapture = vi.fn(() => { captured = false })
  await act(async () => { fireEvent.pointerDown(slider, { button: 0, clientY: 20, pointerId: 1 }) })
  expect(slider.getAttribute('aria-valuenow')).toBe('12')
  expect(document.activeElement).toBe(slider)
  expect(slider.setPointerCapture).toHaveBeenCalledWith(1)
  await act(async () => { fireEvent.pointerMove(slider, { clientY: 300, pointerId: 1 }) })
  expect(slider.getAttribute('aria-valuenow')).toBe('-12')
  await act(async () => { fireEvent.pointerUp(slider, { pointerId: 1 }) })
  await act(async () => { fireEvent.pointerMove(slider, { clientY: 128, pointerId: 1 }) })
  expect(slider.getAttribute('aria-valuenow')).toBe('-12')
  await act(async () => { fireEvent.click(screen.getByRole('switch', { name: 'Включить эквалайзер' })) })
  await act(async () => { fireEvent.pointerDown(slider, { button: 0, clientY: 128, pointerId: 1 }) })
  expect(screen.queryByRole('slider')).toBeNull()
  expect(browser.snapshot().equalizer).toEqual({ ...equalizer.defaults, enabled: false, gains: [-12, 0, 0, 0, 0, 0, 0, 0, 0, 0] })
})

it('asks only after enabling, explains access, preserves EQ after refusal and retries on demand', async () => {
  vi.useFakeTimers()
  const browser = createChrome({ equalizer: { enabled: false, gains: [6, 4, 0, -1, 0], userPresets: [{ id: 'saved', name: 'Наушники', gains: equalizer.presets.bass, preamp: 0 }] } })
  browser.api.runtime.onMessage.addListener(() => {})
  browser.api.permissions.contains.mockResolvedValue(false)
  const request = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  Object.assign(browser.api.permissions, { request })
  const { AppModalRoot, setSettingsModal } = await import('@/entities/modal')
  await renderUI(createElement(AppModalRoot))
  await act(async () => { setSettingsModal(); await vi.advanceTimersByTimeAsync(1000) })
  const settings = screen.getByRole('dialog', { name: 'Настройки' })
  expect(request).not.toHaveBeenCalled()
  expect(screen.queryByRole('dialog', { name: 'Эквалайзер для VK Mix' })).toBeNull()
  const toggle = within(settings).getByRole('switch', { name: 'Включить эквалайзер' })
  await act(async () => { fireEvent.click(toggle); await vi.advanceTimersByTimeAsync(1000) })
  let permission = screen.getByRole('dialog', { name: 'Эквалайзер для VK Mix' })
  expect(permission.textContent).toContain('okcdn.ru')
  expect(permission.textContent).toContain('остальных источников')
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(permission.contains(document.activeElement)).toBe(true)
  expect(request).not.toHaveBeenCalled()
  await act(async () => { fireEvent.click(within(permission).getByRole('button', { name: 'Не сейчас' })); await vi.advanceTimersByTimeAsync(1000) })
  expect((browser.snapshot().equalizer as equalizer.Settings).enabled).toBe(true)
  expect((browser.snapshot().equalizer as equalizer.Settings).mixAccessDenied).toBe(true)
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets[0].name).toBe('Наушники')
  expect(within(settings).getAllByRole('slider')).toHaveLength(11)
  expect(screen.getByText(/VK Mix пока без эквалайзера/)).toBeTruthy()
  await act(async () => { fireEvent.click(toggle) })
  await act(async () => { fireEvent.click(toggle); await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.queryByRole('dialog', { name: 'Эквалайзер для VK Mix' })).toBeNull()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Выдать доступ' })); await vi.advanceTimersByTimeAsync(1000) })
  permission = screen.getByRole('dialog', { name: 'Эквалайзер для VK Mix' })
  await act(async () => { fireEvent.click(within(permission).getByRole('button', { name: 'Разрешить' })); await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.getByText(/VK Mix пока без эквалайзера/)).toBeTruthy()
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Выдать доступ' })); await vi.advanceTimersByTimeAsync(1000) })
  permission = screen.getByRole('dialog', { name: 'Эквалайзер для VK Mix' })
  await act(async () => { fireEvent.click(within(permission).getByRole('button', { name: 'Разрешить' })); await vi.advanceTimersByTimeAsync(1000) })
  expect(request).toHaveBeenLastCalledWith({ origins: ['https://*.okcdn.ru/*'] })
  expect(browser.api.runtime.sendMessage).toHaveBeenCalledWith({ target: 'service-worker', type: 'retry-equalizer' })
  expect(screen.queryByRole('button', { name: 'Выдать доступ' })).toBeNull()
  expect((browser.snapshot().equalizer as equalizer.Settings).mixAccessDenied).toBe(false)
  await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(settings.contains(document.activeElement)).toBe(true)
})

it('does not automatically request access on reopening an already-enabled equalizer', async () => {
  const browser = createChrome({ equalizer: { enabled: true, mixAccessDenied: true } })
  browser.api.permissions.contains.mockResolvedValue(false)
  const request = vi.fn()
  Object.assign(browser.api.permissions, { request })
  const { EqualizerSettings } = await import('../../packages/front/src/entities/modal/ui/EqualizerSettings')
  await renderUI(createElement(EqualizerSettings))
  expect(await screen.findByRole('button', { name: 'Выдать доступ' })).toBeTruthy()
  expect(screen.queryByRole('dialog', { name: 'Эквалайзер для VK Mix' })).toBeNull()
  expect(request).not.toHaveBeenCalled()
  expect(screen.getAllByRole('slider')).toHaveLength(11)
})

it('keeps the selected personal preset editable and can overwrite, copy or delete its edited curve', async () => {
  const browser = createChrome({ equalizer: { ...equalizer.defaults, enabled: true, gains: equalizer.presets.bass, presetId: 'headphones', userPresets: [{ id: 'headphones', name: 'Наушники', gains: equalizer.presets.bass, preamp: -3 }], preamp: -3 } })
  const { EqualizerSettings } = await import('../../packages/front/src/entities/modal/ui/EqualizerSettings')
  await renderUI(createElement(EqualizerSettings))
  await act(async () => { await browser.api.storage.local.get('equalizer') })
  const bass = screen.getByRole('slider', { name: '32 Гц' })
  await act(async () => { fireEvent.keyDown(bass, { key: 'ArrowUp' }) })
  await act(async () => { fireEvent.keyDown(screen.getByRole('slider', { name: 'Preamp' }), { key: 'ArrowUp' }) })
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe('Наушники')
  expect(screen.getByRole('button', { name: 'Удалить пресет' })).toBeTruthy()
  expect((browser.snapshot().equalizer as equalizer.Settings).userPresets[0].gains[0]).toBe(6)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сохранить изменения' })) })
  let settings = browser.snapshot().equalizer as equalizer.Settings
  expect(settings.userPresets).toHaveLength(1)
  expect(settings.userPresets[0]).toMatchObject({ id: 'headphones', name: 'Наушники', preamp: -2 })
  expect(settings.userPresets[0].gains[0]).toBe(7)
  expect(screen.queryByRole('button', { name: 'Сохранить изменения' })).toBeNull()
  await act(async () => { fireEvent.keyDown(bass, { key: 'ArrowUp' }) })
  await saveAs('Вариант')
  settings = browser.snapshot().equalizer as equalizer.Settings
  expect(settings.userPresets.map(item => item.gains[0])).toEqual([7, 8])
  await act(async () => { fireEvent.keyDown(bass, { key: 'ArrowUp' }) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Удалить пресет' })) })
  await act(async () => { fireEvent.click(within(screen.getByRole('group', { name: 'Удаление пресета' })).getByRole('button', { name: 'Удалить' })) })
  settings = browser.snapshot().equalizer as equalizer.Settings
  expect(settings.userPresets.map(item => item.name)).toEqual(['Наушники'])
  expect(settings.gains[0]).toBe(9)
})

it.each(['edited', 'flat', 'builtin'])('resets a %s personal preset to Flat and can immediately recall the saved curve', async kind => {
  const gains = kind === 'flat' ? equalizer.presets.flat : equalizer.presets.bass
  const saved = { id: 'personal', name: 'Наушники', gains: [...gains], preamp: kind === 'edited' ? -3 : 0 }
  const browser = createChrome({ equalizer: { ...equalizer.defaults, enabled: true, autoGain: true, mixAccessDenied: true, gains, preamp: saved.preamp, presetId: saved.id, userPresets: [saved] } })
  const { EqualizerSettings } = await import('../../packages/front/src/entities/modal/ui/EqualizerSettings')
  await renderUI(createElement(EqualizerSettings))
  await act(async () => { await browser.api.storage.local.get('equalizer') })
  if (kind === 'edited') {
    await act(async () => { fireEvent.keyDown(screen.getByRole('slider', { name: '32 Гц' }), { key: 'ArrowUp' }) })
    expect(screen.getByRole('button', { name: 'Сохранить изменения' })).toBeTruthy()
  }
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сохранить как…' })) })
  expect((screen.getByRole('button', { name: 'Сбросить' }) as HTMLButtonElement).disabled).toBe(false)
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Сбросить' })) })
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe('Ровный звук')
  expect(screen.queryByRole('form', { name: 'Новый пресет' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Сохранить изменения' })).toBeNull()
  expect(browser.snapshot().equalizer).toMatchObject({ gains: equalizer.presets.flat, preamp: 0, presetId: '', enabled: true, autoGain: true, mixAccessDenied: true, userPresets: [saved] })
  await choosePreset('Наушники')
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe('Наушники')
  expect(browser.snapshot().equalizer).toMatchObject({ gains: saved.gains, preamp: saved.preamp, presetId: saved.id, userPresets: [saved] })
  await choosePreset(kind === 'flat' ? 'Ровный звук' : 'Больше баса')
  expect((screen.getByRole('combobox', { name: 'Пресет' }) as HTMLInputElement).value).toBe(kind === 'flat' ? 'Ровный звук' : 'Больше баса')
})
