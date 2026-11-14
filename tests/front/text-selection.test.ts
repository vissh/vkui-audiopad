// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createChrome } from '../helpers/chrome'
import { track } from '../helpers/playback'

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe () {} unobserve () {} disconnect () {} })
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
})
afterEach(() => {
  window.getSelection()?.removeAllRanges()
  cleanup()
})

const select = (element: Node) => {
  const range = document.createRange()
  range.selectNodeContents(element)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

it.each([false, true])('copies artist text without navigation or row playback, structured artists %s', async structured => {
  createChrome()
  const { ArtistTitle } = await import('@/shared/ui/artist-title')
  const { TrackCell } = await import('@/entities/track')
  const source = { ...track('1_1'), artist: 'Artist &amp; Co', mainArtists: structured ? [{ id: 'main', name: 'Artist &amp; Co' }] : [], featArtists: structured ? [{ id: 'feat', name: 'Guest' }] : [] }
  const play = vi.fn()
  const search = vi.fn()
  const artist = vi.fn()
  render(createElement(TrackCell, { title: 'Track', artist: createElement(ArtistTitle, { track: source, onSearch: search, onArtist: artist }), duration: 180, image: '', trackState: 'normal', onClick: play }))
  const button = screen.getByRole('button', { name: 'Artist & Co' })
  fireEvent.mouseDown(button)
  select(button)
  fireEvent.mouseUp(button)
  fireEvent.click(button, { detail: 1 })
  expect(window.getSelection()?.toString()).toBe('Artist & Co')
  expect(search).not.toHaveBeenCalled()
  expect(artist).not.toHaveBeenCalled()
  expect(play).not.toHaveBeenCalled()
  // Keyboard activation still works while the copied text is selected.
  fireEvent.click(button, { detail: 0 })
  if (structured) expect(artist).toHaveBeenCalledExactlyOnceWith(source.mainArtists[0])
  else expect(search).toHaveBeenCalledExactlyOnceWith('Artist & Co')
  window.getSelection()?.removeAllRanges()
  fireEvent.click(button, { detail: 1 })
  expect(structured ? artist : search).toHaveBeenCalledTimes(2)
  expect(play).not.toHaveBeenCalled()
  if (structured) {
    const names = button.closest('.vkap_artists')
    if (names == null) throw new Error('Missing artists')
    select(names)
    fireEvent.click(names, { detail: 1 })
    expect(window.getSelection()?.toString()).toBe('Artist & Co feat. Guest')
    expect(play).not.toHaveBeenCalled()
    expect(artist).toHaveBeenCalledTimes(2)
  }
})

it('does not play on a title or row selection, and ignores selections elsewhere', async () => {
  createChrome()
  const { TrackCell } = await import('@/entities/track')
  const play = vi.fn()
  render(createElement('div', {}, createElement('p', {}, 'Unrelated text'), createElement(TrackCell, { title: 'Track title', artist: 'Artist', duration: 180, image: '', trackState: 'normal', onClick: play })))
  const button = screen.getByRole('button', { name: 'Воспроизвести Track title' })
  const row = button.closest('.vkap_track_cell')
  if (row == null) throw new Error('Missing track row')
  select(button)
  fireEvent.click(button, { detail: 1 })
  fireEvent.click(row, { detail: 1 })
  expect(play).not.toHaveBeenCalled()
  fireEvent.click(button, { detail: 0 })
  expect(play).toHaveBeenCalledOnce()
  select(screen.getByText('Unrelated text'))
  fireEvent.click(button, { detail: 1 })
  expect(play).toHaveBeenCalledTimes(2)
  window.getSelection()?.removeAllRanges()
  fireEvent.click(row, { detail: 1 })
  expect(play).toHaveBeenCalledTimes(3)
})

it('keeps player artist selection on the current page without playback commands', async () => {
  const browser = createChrome({ activeTrack: { ...track('1_1'), artist: 'Player artist' }, activeTab: { tab: 'current-playlist' } })
  const { Player } = await import('@/widgets/player')
  render(createElement(Player))
  await act(async () => { await browser.api.storage.local.get() })
  const artist = screen.getByRole('button', { name: 'Player artist' })
  select(artist)
  fireEvent.click(artist, { detail: 1 })
  expect(window.getSelection()?.toString()).toBe('Player artist')
  expect((await browser.api.storage.local.get('activeTab')).activeTab).toEqual({ tab: 'current-playlist' })
  expect(browser.api.runtime.sendMessage).not.toHaveBeenCalled()
  window.getSelection()?.removeAllRanges()
  fireEvent.click(artist, { detail: 1 })
  expect((await browser.api.storage.local.get('activeTab')).activeTab).toEqual({ tab: 'search', value: 'Player artist' })
})
