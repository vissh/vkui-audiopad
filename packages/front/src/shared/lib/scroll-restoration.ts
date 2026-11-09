import { createContext, useContext, useLayoutEffect, useRef } from 'react'

export interface ScrollPagination {
  key: string
  pending: boolean
  failed: boolean
  hasMore: boolean
  loadMore: () => Promise<unknown> | void
}

export const ScrollRestorationContext = createContext({
  restoring: false,
  register: (_id: symbol, _pagination: ScrollPagination): (() => void) => () => {}
})

export const useScrollPagination = (active: boolean, pagination: ScrollPagination): boolean => {
  const { restoring, register } = useContext(ScrollRestorationContext)
  const id = useRef(Symbol('scroll-pagination'))
  useLayoutEffect(() => {
    if (active) return register(id.current, pagination)
  })
  return restoring
}
