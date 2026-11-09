import { commonTypes } from '@vk-audiopad/common'
import { useScroll } from '@vkontakte/vkui'
import { useCallback, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useCurrentPlaylist } from '@/entities/active-track'
import { useSessionUserId } from '@/entities/session'
import { ScrollRestorationContext, type ScrollPagination } from '@/shared/lib/scroll-restoration'
import { useActiveTab } from '@/shared/model'
import { readScrollPositions, saveScrollPosition, type ScrollPosition } from './scroll-positions'

const playlistKey = (playlist: commonTypes.Playlist | null) => playlist == null ? [] : [playlist.ownerId, playlist.id, playlist.blockId]

const routeKey = (tab: commonTypes.ActiveTabs, queue: commonTypes.Playlist | null): string => {
  switch (tab.tab) {
    case commonTypes.ContentTab.PLAYLIST: return JSON.stringify([tab.tab, tab.fromId, ...playlistKey(tab.playlist)])
    case commonTypes.ContentTab.CURRENT_PLAYLIST: return JSON.stringify([tab.tab, ...playlistKey(queue)])
    case commonTypes.ContentTab.SEARCH: return JSON.stringify([tab.tab, tab.value])
    case commonTypes.ContentTab.ARTIST: return JSON.stringify([tab.tab, tab.id])
    case commonTypes.ContentTab.ALBUMS: return JSON.stringify([tab.tab, tab.showAllLink])
    default: return JSON.stringify([tab.tab])
  }
}

export const ApplicationScrollRestoration = ({ children }: { children: ReactNode }) => {
  const userId = useSessionUserId()
  const tab = useActiveTab()
  const queue = useCurrentPlaylist()
  const page = routeKey(tab, queue)
  const persistent = tab.tab === commonTypes.ContentTab.MY_MUSIC || tab.tab === commonTypes.ContentTab.PLAYLIST || (tab.tab === commonTypes.ContentTab.CURRENT_PLAYLIST && queue != null)
  const { getScroll, scrollTo } = useScroll()
  const positions = useRef(new Map<string, ScrollPosition>())
  const pagination = useRef(new Map<symbol, ScrollPagination>())
  const check = useRef(() => {})
  const [restoringPage, setRestoringPage] = useState<string | null>(null)
  const identity = JSON.stringify([userId, page])
  const register = useCallback((id: symbol, source: ScrollPagination) => {
    pagination.current.set(id, source)
    check.current()
    return () => { pagination.current.delete(id) }
  }, [])
  const context = useMemo(() => ({ register, restoring: restoringPage === identity }), [register, restoringPage, identity])

  useLayoutEffect(() => {
    if (tab.tab === commonTypes.ContentTab.UNKNOWN) return
    const viewport = document.querySelector<HTMLElement>('.vkap_action_popup')
    const scrollTarget = viewport ?? window
    const content = document.getElementById('vkap-content')
    const stored = persistent ? readScrollPositions(userId).get(page) : undefined
    const target = positions.current.get(identity) ?? stored
    let restoring = target != null && target.y > 0
    let frame = 0
    let saveTimer: ReturnType<typeof setTimeout> | undefined
    let lastPosition = target ?? { y: 0, anchor: null, offset: 0 }
    let requests = 0
    let running = false
    let disposed = false
    const attempted = new Set<string>()
    const visibleTop = () => Math.max(viewport?.getBoundingClientRect().top ?? 0, document.querySelector('#vkap-player .vkuiPanelHeader__in')?.getBoundingClientRect().bottom ?? 0)
    const anchors = () => Array.from(content?.querySelectorAll<HTMLElement>('[data-scroll-anchor]') ?? []).filter(element => !element.closest('[hidden], [inert]'))
    const capture = (): ScrollPosition => {
      const y = getScroll().y
      const top = visibleTop()
      const bottom = viewport?.getBoundingClientRect().bottom ?? window.innerHeight
      const x = (viewport?.getBoundingClientRect().left ?? 0) + (viewport?.clientWidth ?? window.innerWidth) / 2
      const hit = document.elementFromPoint?.(x, top + 1)?.closest<HTMLElement>('[data-scroll-anchor]')
      const anchor = hit != null && content?.contains(hit) === true
        ? hit
        : anchors().find(element => {
          const rect = element.getBoundingClientRect()
          return rect.height > 0 && rect.bottom > top && rect.top < bottom
        })
      return { y, anchor: y > 0 ? anchor?.dataset.scrollAnchor ?? null : null, offset: anchor == null ? 0 : anchor.getBoundingClientRect().top - top }
    }
    const save = () => {
      clearTimeout(saveTimer)
      if (restoring || disposed) return
      positions.current.delete(identity)
      positions.current.set(identity, lastPosition)
      if (positions.current.size > 50) positions.current.delete(positions.current.keys().next().value ?? '')
      if (persistent) saveScrollPosition(userId, page, lastPosition)
    }
    const finish = (fallback: boolean) => {
      if (!restoring || disposed) return
      if (fallback) scrollTo(0, target?.y ?? 0)
      restoring = false
      lastPosition = capture()
      setRestoringPage(null)
    }
    const update = () => {
      frame = 0
      if (!restoring || disposed || target == null) return
      const anchor = anchors().find(element => element.dataset.scrollAnchor === target.anchor && element.getBoundingClientRect().height > 0)
      if (anchor != null) {
        scrollTo(0, getScroll().y + anchor.getBoundingClientRect().top - visibleTop() - target.offset)
        finish(false)
        return
      }
      const sources = [...pagination.current.values()]
      if (running || sources.some(source => source.pending)) return
      if (target.anchor == null) {
        const root = viewport ?? document.documentElement
        if (root.scrollHeight - root.clientHeight >= target.y) {
          scrollTo(0, target.y)
          finish(false)
          return
        }
      }
      const next = sources.find(source => source.hasMore && !source.failed && !attempted.has(source.key))
      if (next == null || requests >= 10) {
        if (sources.length > 0) finish(true)
        return
      }
      attempted.add(next.key)
      requests++
      running = true
      void Promise.resolve().then(next.loadMore).catch(() => { finish(true) }).finally(() => {
        running = false
        schedule()
      })
    }
    const schedule = () => {
      if (!disposed && !frame) frame = requestAnimationFrame(update)
    }
    const onScroll = () => {
      if (!restoring) {
        lastPosition = capture()
        clearTimeout(saveTimer)
        saveTimer = setTimeout(save, 100)
      }
    }
    const cancel = (event: Event) => {
      if (event instanceof KeyboardEvent && !['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return
      finish(false)
    }
    check.current = schedule
    scrollTo(0, 0)
    setRestoringPage(restoring ? identity : null)
    const observer = new MutationObserver(schedule)
    if (content != null) observer.observe(content, { childList: true, subtree: true })
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule)
    if (content != null) resize?.observe(content)
    const deadline = setTimeout(() => { finish(true) }, 8000)
    scrollTarget.addEventListener('scroll', onScroll, { passive: true })
    for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) scrollTarget.addEventListener(event, cancel, { passive: true })
    window.addEventListener('pagehide', save)
    schedule()
    return () => {
      save()
      disposed = true
      cancelAnimationFrame(frame)
      clearTimeout(saveTimer)
      clearTimeout(deadline)
      observer.disconnect()
      resize?.disconnect()
      scrollTarget.removeEventListener('scroll', onScroll)
      for (const event of ['wheel', 'touchstart', 'pointerdown', 'keydown']) scrollTarget.removeEventListener(event, cancel)
      window.removeEventListener('pagehide', save)
      check.current = () => {}
    }
  }, [identity, page, persistent, userId, getScroll, scrollTo, tab.tab])

  return <ScrollRestorationContext.Provider value={context}>{children}</ScrollRestorationContext.Provider>
}
