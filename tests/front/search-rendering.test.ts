// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { type CatalogBlock } from '@/shared/types'
import { playlist } from '../helpers/playback'

afterEach(() => {
  cleanup()
  vi.doUnmock('@/widgets/navigation')
  vi.doUnmock('@/widgets/catalog-gallery')
  vi.doUnmock('../../packages/front/src/pages/search-result/model/hooks')
})

it('renders all ready search groups immediately, retains focused controls and clears loading on failure', async () => {
  vi.stubGlobal('matchMedia', vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: () => true })))
  const { CatalogBlockDataType } = await import('@/shared/types')
  const groups = (prefix: string): CatalogBlock[] => [0, 1, 2].map(index => ({ dataType: CatalogBlockDataType.TRACKS, blockId: prefix + index, playlist: playlist(['1_' + index], prefix + index) }))
  let blocks: CatalogBlock[] | undefined = groups('first-')
  let failed = false
  vi.doMock('@/widgets/navigation', () => ({ Navigation: () => null }))
  vi.doMock('@/widgets/catalog-gallery', () => ({ CatalogGallery: ({ catalogBlock, isPending, loadingBlock }: { catalogBlock: CatalogBlock | null, isPending: boolean, loadingBlock: string }) => catalogBlock == null ? null : createElement('section', { 'data-testid': catalogBlock.blockId, 'data-loading-kind': loadingBlock }, isPending ? 'Loading' : createElement('button', {}, catalogBlock.blockId)) }))
  vi.doMock('../../packages/front/src/pages/search-result/model/hooks', () => ({ useSearchData: () => ({ data: blocks, isPending: false, error: failed ? new Error('Synthetic search failure') : null }) }))
  const { SearchResult } = await import('@/pages/search-result')
  const view = render(createElement(SearchResult, { userId: '1', searchValue: 'first' }))
  const first = screen.getByRole('button', { name: 'first-0' })
  first.focus()
  expect(screen.getAllByRole('button').map(element => element.textContent)).toEqual(['first-0', 'first-1', 'first-2'])
  expect(screen.queryByRole('status', { name: 'Загрузка подборки' })).toBeNull()
  view.rerender(createElement(SearchResult, { userId: '1', searchValue: 'first' }))
  expect(screen.getByRole('button', { name: 'first-0' })).toBe(first)
  expect(document.activeElement).toBe(first)
  blocks = groups('second-')
  view.rerender(createElement(SearchResult, { userId: '1', searchValue: 'second' }))
  expect(screen.getByRole('button', { name: 'second-0' })).not.toBeNull()
  expect(screen.getAllByRole('button').map(element => element.textContent)).toEqual(['second-0', 'second-1', 'second-2'])
  blocks = undefined
  failed = true
  vi.spyOn(console, 'error').mockImplementation(() => {})
  view.rerender(createElement(SearchResult, { userId: '1', searchValue: 'failed' }))
  expect(screen.queryByRole('status', { name: 'Загрузка подборки' })).toBeNull()
})
