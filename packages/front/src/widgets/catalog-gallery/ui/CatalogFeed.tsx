import { useInfiniteQuery } from '@tanstack/react-query'
import { Banner, Button, Div, Group, Skeleton, Spinner } from '@vkontakte/vkui'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { catalogStaleTime, fetchCatalogSection, fetchHomeHighlights } from '@/shared/api'
import { mergeCatalogBlocks } from '@/shared/lib/pagination'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'
import { HorizontalScroll } from '@/shared/ui/horizontal-scroll'
import { ShowAllLinkSkeleton } from '@/shared/ui/show-all-link'
import { SkeletonWrapper } from '@/shared/ui/skeleton-wrapper'
import { CatalogGallery } from './CatalogGallery'

const emptyBlocks: CatalogBlock[] = []

const title = (block: CatalogBlock) => (block.dataType === CatalogBlockDataType.TRACKS ? block.playlist.title : block.title).trim().replace(/\s+/g, ' ').toLocaleLowerCase('ru')

export const CatalogFeed = ({ userId, active, section = 'general', existing = emptyBlocks, renderLibrary, progressive = false, onRetry }: { userId: string, active: boolean, section?: 'general' | 'all' | 'explore' | 'radiostations', existing?: CatalogBlock[], renderLibrary?: (showAllLink: string) => ReactNode, progressive?: boolean, onRetry?: () => void }) => {
  const query = useInfiniteQuery({
    queryKey: ['audioCatalog', userId, section],
    initialPageParam: { sectionId: '', cursor: '' },
    queryFn: async ({ signal, pageParam }) => pageParam.sectionId.length === 0 ? await fetchHomeHighlights(userId, signal, section) : await fetchCatalogSection(pageParam.sectionId, pageParam.cursor, signal),
    getNextPageParam: (last, pages) => last.nextFrom.length === 0 || pages.slice(0, -1).some(page => page.nextFrom === last.nextFrom) ? undefined : { sectionId: last.sectionId, cursor: last.nextFrom },
    enabled: active && userId.length > 0,
    staleTime: catalogStaleTime,
    retry: false,
    networkMode: 'always',
    refetchOnWindowFocus: false
  })
  const isLibrary = (block: CatalogBlock) => renderLibrary != null && (('library' in block && block.library === true) || ['плейлисты', 'мои плейлисты'].includes(title(block)))
  const candidates = existing.filter(block => !isLibrary(block))
  const catalogReady = query.data?.pages.some(page => page.blocks.length > 0) === true
  const scope = JSON.stringify([userId, section])
  const [initialSource, setInitialSource] = useState<{ scope: string, legacy: boolean } | null>(null)
  if (progressive && active && initialSource?.scope !== scope && (catalogReady || candidates.length > 0)) {
    setInitialSource({ scope, legacy: !catalogReady })
  }
  const leading = progressive && initialSource?.scope === scope && initialSource.legacy ? candidates.find(block => title(block).length > 0) ?? candidates[0] : undefined
  const { hasNextPage, isFetching, isError, fetchNextPage } = query
  const { ref, inView } = useInView({ skip: !active || !hasNextPage, fallbackInView: false })
  const attempted = useRef(new Set<string>())
  const pages = query.data?.pages ?? []
  const last = pages[pages.length - 1]
  const cursorKey = JSON.stringify([userId, section, last?.sectionId, last?.nextFrom])
  useEffect(() => {
    if (!active || !inView || !hasNextPage || isFetching || isError || attempted.current.has(cursorKey)) return
    attempted.current.add(cursorKey)
    void fetchNextPage({ cancelRefetch: false })
  }, [active, inView, cursorKey, hasNextPage, isFetching, isError, fetchNextPage])
  const blocks = useMemo(() => query.data?.pages.reduce<CatalogBlock[]>((previous, page) => mergeCatalogBlocks(previous, page.blocks), []) ?? [], [query.data?.pages])
  const fallback = query.isError && query.data == null
  const displayed = useMemo(() => {
    const matching = (block: CatalogBlock) => leading != null && block.dataType === leading.dataType && (block.blockId === leading.blockId || (title(block).length > 0 && title(block) === title(leading)))
    const catalogLeading = blocks.find(matching)
    const first = leading?.dataType === CatalogBlockDataType.TRACKS && catalogLeading?.dataType === CatalogBlockDataType.TRACKS
      ? { ...leading, playlist: { ...leading.playlist, catalogLink: catalogLeading.playlist.catalogLink } }
      : leading
    const available = fallback ? existing : blocks
    const source = first != null ? [first, ...available.filter(block => !matching(block))] : available
    return source.map(block => {
      const legacy = existing.find(item => item.dataType === block.dataType && (item.blockId === block.blockId || (title(block).length > 0 && title(item) === title(block))))
      return block.dataType === CatalogBlockDataType.TRACKS && legacy?.dataType === CatalogBlockDataType.TRACKS
        ? { ...block, playlist: { ...legacy.playlist, title: block.playlist.title, catalogLink: block.playlist.catalogLink, catalogLayout: block.playlist.catalogLayout } }
        : block
    })
  }, [blocks, existing, fallback, leading])
  const pending = active && !query.isError && query.isPending
  const library = blocks.find(isLibrary) ?? existing.find(isLibrary)
  const galleries = displayed.filter(block => !isLibrary(block)).map((block, index) => <CatalogGallery key={JSON.stringify([block.blockId, leading != null && index === 0])} mode='card' isPending={false} loadingBlock='albums' userId={userId} catalogBlock={block} />)
  const errorNotice = query.isError && <Banner title='Некоторые подборки не загрузились' subtitle='Остальная музыка доступна' actions={<Button mode='secondary' onClick={() => { onRetry?.(); void (query.data == null ? query.refetch() : query.fetchNextPage()) }}>Повторить</Button>} />
  return (
    <>
      {!progressive && errorNotice}
      {pending && leading == null && <SkeletonWrapper isPending skeleton={renderLibrary != null ? <CatalogGallery mode='card' userId={userId} isPending loadingBlock='tracks' catalogBlock={null} /> : <CatalogFeedSkeleton section={section} userId={userId} />}>{null}</SkeletonWrapper>}
      {galleries.slice(0, renderLibrary != null ? 1 : galleries.length)}
      {renderLibrary != null && <div key='library'>{renderLibrary(library != null && 'showAllLink' in library ? library.showAllLink : '')}</div>}
      {renderLibrary != null && galleries.slice(1)}
      {pending && (leading != null || renderLibrary != null) && <SkeletonWrapper isPending skeleton={renderLibrary != null ? <Group><Div><Spinner size='m' aria-label='Загрузка подборок' /></Div></Group> : <CatalogFeedSkeleton section={section} userId={userId} />}>{null}</SkeletonWrapper>}
      {progressive && errorNotice}
      {active && query.hasNextPage && <div ref={ref} aria-hidden='true' style={{ height: 1 }} />}
      {query.hasNextPage && !query.isError && <Group mode='card'><Div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 48 }}>{query.isFetchingNextPage ? <Spinner size='m' aria-label='Загрузка подборок' /> : <Button mode='tertiary' disabled={query.isFetching} onClick={() => { void query.fetchNextPage() }}>Ещё подборки</Button>}</Div></Group>}
    </>
  )
}

const CatalogFeedSkeleton = ({ section, userId }: { section: string, userId: string }) => {
  if (section === 'radiostations') {
    return (
      <Group header={<ShowAllLinkSkeleton />} aria-label='Загрузка подборок' aria-busy='true'>
        <div className='vkap_radio_grid'>
          {Array.from({ length: 12 }, (_, index) => <Skeleton key={index} height={166} />)}
        </div>
      </Group>
    )
  }
  return (
    <div aria-label='Загрузка подборок' aria-busy='true'>
      {section === 'explore'
        ? <Group header={<ShowAllLinkSkeleton />}>
            <HorizontalScroll>
              <div style={{ display: 'flex', gap: 12, padding: '8px 16px 16px' }}>
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index}>
                    <Skeleton width={316} height={174} />
                    <Skeleton width={200} height={20} style={{ marginTop: 12 }} />
                    <Skeleton width={280} height={16} style={{ marginTop: 8 }} />
                  </div>
                ))}
              </div>
            </HorizontalScroll>
          </Group>
        : <CatalogGallery mode='card' userId={userId} isPending loadingBlock='tracks' catalogBlock={null} />}
      <CatalogGallery mode='card' userId={userId} isPending loadingBlock='albums' catalogBlock={null} />
      <CatalogGallery mode='card' userId={userId} isPending loadingBlock='albums' catalogBlock={null} />
    </div>
  )
}
