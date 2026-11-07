import { useInfiniteQuery } from '@tanstack/react-query'
import { Banner, Button, Div, Skeleton } from '@vkontakte/vkui'
import { CatalogGallery } from '@/widgets/catalog-gallery'
import { fetchCatalogSection, fetchHomeHighlights } from '@/shared/api'
import { mergeCatalogBlocks } from '@/shared/lib/pagination'
import { CatalogBlockDataType, type CatalogBlock } from '@/shared/types'

const blockTitle = (block: CatalogBlock) => block.dataType === CatalogBlockDataType.TRACKS ? block.playlist.title : block.title

export const HomeHighlights = ({ userId, active, existing }: { userId: string, active: boolean, existing: CatalogBlock[] }) => {
  const query = useInfiniteQuery({
    queryKey: ['homeHighlights', userId],
    initialPageParam: { sectionId: '', cursor: '' },
    queryFn: async ({ signal, pageParam }) => pageParam.sectionId.length === 0 ? await fetchHomeHighlights(userId, signal) : await fetchCatalogSection(pageParam.sectionId, pageParam.cursor, signal),
    getNextPageParam: (last, pages) => last.nextFrom.length === 0 || pages.slice(0, -1).some(page => page.nextFrom === last.nextFrom)
      ? undefined
      : { sectionId: last.sectionId, cursor: last.nextFrom },
    enabled: active && userId.length > 0,
    retry: false,
    networkMode: 'always',
    refetchOnWindowFocus: false
  })
  const titles = new Set(existing.map(block => blockTitle(block).trim().toLocaleLowerCase()))
  const ids = new Set(existing.map(block => block.blockId))
  const blocks = query.data?.pages.reduce<CatalogBlock[]>((previous, page) => mergeCatalogBlocks(previous, page.blocks), []) ?? []
  return (
    <>
      {query.isPending && active && <Div aria-label='Загрузка подборок'><Skeleton height={104} /></Div>}
      {query.isError && <Banner title='Некоторые подборки не загрузились' subtitle='Остальная музыка доступна' actions={<Button mode='secondary' onClick={() => { void (query.data == null ? query.refetch() : query.fetchNextPage()) }}>Повторить</Button>} />}
      {blocks.filter(block => !ids.has(block.blockId) && (blockTitle(block).length === 0 || !titles.has(blockTitle(block).trim().toLocaleLowerCase()))).map(block => <CatalogGallery key={block.blockId} mode='card' isPending={false} loadingBlock='albums' userId={userId} catalogBlock={block} />)}
      {query.hasNextPage && !query.isError && <Div><Button mode='secondary' disabled={query.isFetching} loading={query.isFetchingNextPage} onClick={() => { void query.fetchNextPage() }}>Ещё подборки</Button></Div>}
    </>
  )
}
