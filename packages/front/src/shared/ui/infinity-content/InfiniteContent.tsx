import { Banner, Button } from '@vkontakte/vkui'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'
import { useScrollPagination } from '../../lib/scroll-restoration'
import { Content } from '../content'

interface PaginationMutation<Args> {
  isPending: boolean
  isError: boolean
  isSuccess: boolean
  mutateAsync: (args: Args) => Promise<unknown>
}

interface InfinityContentProps<Args> {
  display: boolean
  children: ReactNode
  hasMore: boolean
  initialPending?: boolean
  paginationScope: string
  pageKey: string
  loadMoreMutation: PaginationMutation<Args>
  loadMoreArgs?: Args | null
  error?: unknown
}

export const InfinityContent = <Args,>({
  display,
  children,
  hasMore,
  initialPending = false,
  paginationScope,
  pageKey,
  loadMoreMutation,
  loadMoreArgs,
  error
}: InfinityContentProps<Args>): ReactNode => {
  const { ref, inView } = useInView({ skip: !display || !hasMore })
  const attempts = useRef({ scope: '', keys: new Set<string>() })
  const running = useRef(false)
  const [requested, setRequested] = useState({ scope: '', keys: new Set<string>() })
  const { isPending, isError, isSuccess, mutateAsync } = loadMoreMutation
  const failed = requested.scope === paginationScope && isError
  const stalled = requested.scope === paginationScope && isSuccess && requested.keys.has(pageKey)

  const request = useCallback((explicit: boolean): Promise<unknown> | undefined => {
    if (!display || !hasMore || loadMoreArgs == null || error != null || running.current || isPending) return
    const previous = attempts.current.scope === paginationScope ? attempts.current.keys : new Set<string>()
    if (!explicit && (previous.has(pageKey) || failed)) return
    const next = { scope: paginationScope, keys: new Set([...previous, pageKey]) }
    attempts.current = next
    running.current = true
    setRequested(next)
    // Mutation state renders the safe retry feedback; never replay automatically.
    return mutateAsync(loadMoreArgs).catch(() => {}).finally(() => { running.current = false })
  }, [display, hasMore, loadMoreArgs, error, isPending, paginationScope, pageKey, failed, mutateAsync])

  const restoring = useScrollPagination(display, {
    key: JSON.stringify([paginationScope, pageKey]),
    // Queue pages can arrive through storage after the request has completed.
    pending: initialPending || isPending || stalled,
    failed: error != null || failed || stalled,
    hasMore: hasMore && loadMoreArgs != null,
    loadMore: () => request(false)
  })

  useEffect(() => {
    if (inView && !restoring) void request(false)
  }, [inView, restoring, request])

  return (
    <Content display={display} loading={isPending} error={error}>
      {children}
      {display && hasMore && !isPending && (failed || stalled) && (
        <Banner
          role='status'
          title={failed ? 'Не удалось загрузить продолжение списка' : 'Список не продолжился'}
          subtitle='Уже загруженные записи сохранены. Можно повторить попытку'
          actions={<Button mode='secondary' onClick={() => { request(true) }}>Повторить</Button>}
        />
      )}
      {display && hasMore && <div ref={ref} aria-hidden='true' />}
      {display && hasMore && !isPending && !failed && !stalled && <div className='vkap_keyboard_load_more'><Button mode='tertiary' onClick={() => { request(true) }}>Показать ещё</Button></div>}
    </Content>
  )
}
