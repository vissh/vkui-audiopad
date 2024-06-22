/* eslint-disable @typescript-eslint/no-explicit-any */
import { type UseMutationResult } from '@tanstack/react-query'
import { useEffect, type FC } from 'react'
import { useInView } from 'react-intersection-observer'
import { Content } from '../content'

interface InfinityContentProps {
  display: boolean
  children: React.ReactNode
  hasMore: boolean
  loadMoreMutation: UseMutationResult<any, any, any>
  loadMoreArgs?: any
  error?: any
}

export const InfinityContent: FC<InfinityContentProps> = ({
  display,
  children,
  hasMore,
  loadMoreMutation,
  loadMoreArgs,
  error
}) => {
  const { ref, inView } = useInView({ skip: !hasMore })

  useEffect(() => {
    if (hasMore && inView && !loadMoreMutation.isPending) {
      loadMoreMutation.mutate(loadMoreArgs)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, hasMore, loadMoreMutation.isPending])

  return (
    <Content
      display={display}
      loading={loadMoreMutation.isPending}
      error={error}
    >
      {children}
      {hasMore && <div ref={ref}></div>}
    </Content>
  )
}
