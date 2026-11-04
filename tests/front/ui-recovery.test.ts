// @vitest-environment jsdom
import { act, fireEvent, screen } from '@testing-library/react'
import { createElement, useEffect, type FC } from 'react'
import { type Root } from 'react-dom/client'
import { afterEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'

let root: Root | undefined

afterEach(async () => {
  await act(async () => { root?.unmount() })
  root = undefined
  document.body.replaceChildren()
  vi.doUnmock('@/app/Application')
  vi.doUnmock('react-dom/client')
})

const mountEntrypoint = async (Application: FC) => {
  const container = document.createElement('div')
  container.id = 'root'
  document.body.append(container)
  vi.doMock('@/app/Application', () => ({ Application }))
  vi.doMock('react-dom/client', async importOriginal => {
    const original = await importOriginal<typeof import('react-dom/client')>()
    return { ...original, createRoot: (...args: Parameters<typeof original.createRoot>) => { root = original.createRoot(...args); return root } }
  })
  await act(async () => { await import('../../packages/front/src/index') })
}

it('renders healthy application content without a recovery screen', async () => {
  await mountEntrypoint(() => createElement('p', {}, 'Healthy application'))
  expect(screen.getByText('Healthy application')).not.toBeNull()
  expect(screen.queryByRole('alert')).toBeNull()
})

it.each(['render', 'effect'])('recovers a %s failure without leaking error details or changing playback/session storage', async phase => {
  const saved = { userId: '1', currentPlaylist: { id: 'synthetic' }, played: true, playbackId: 'synthetic-playback', volume: 0.4 }
  const browser = createChrome(saved)
  const reload = vi.fn()
  vi.stubGlobal('location', { reload })
  const errors = vi.spyOn(console, 'error').mockImplementation(() => {})
  const Broken: FC = () => {
    useEffect(() => { if (phase === 'effect') throw new Error('access_token=synthetic-private-value') }, [])
    if (phase === 'render') throw new Error('access_token=synthetic-private-value')
    return null
  }
  await mountEntrypoint(Broken)
  expect(screen.getByRole('alert').textContent).toContain('Не удалось открыть плеер')
  expect(document.body.textContent).not.toContain('synthetic-private-value')
  expect(errors.mock.calls).toEqual([['VK Audiopad UI could not be rendered']])
  const button = screen.getByRole('button', { name: 'Перезагрузить интерфейс' })
  expect(document.activeElement).toBe(button)
  fireEvent.click(button)
  expect(reload).toHaveBeenCalledOnce()
  expect(browser.snapshot()).toEqual(saved)
  expect(browser.api.storage.local.clear).not.toHaveBeenCalled()
  expect(browser.api.storage.local.remove).not.toHaveBeenCalled()
  expect(browser.api.storage.local.set).not.toHaveBeenCalled()
  expect(fetch).not.toHaveBeenCalled()
})
