import { AppRoot } from '@vkontakte/vkui'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { useActiveTab } from '@/shared/model'
import { ApplicationScrollRestoration } from './ApplicationScrollRestoration'

export const ApplicationViewport = ({ children }: { children: ReactNode }) => {
  const popup = chrome.extension?.getViews?.({ type: 'popup' }).includes(window) ?? false
  return (
    <AppRoot scroll={popup ? 'contain' : 'global'} className={popup ? 'vkap_action_popup' : undefined}>
      <ApplicationScrollRestoration>
        <RouteFocus />
        {children}
      </ApplicationScrollRestoration>
    </AppRoot>
  )
}

const RouteFocus = () => {
  const activeTab = useActiveTab()
  const previous = useRef(activeTab)
  useLayoutEffect(() => {
    if (previous.current === activeTab) return
    previous.current = activeTab
    const focused = document.activeElement
    if (focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement) return
    const visible = (element: HTMLElement) => !element.closest('[hidden], [inert]')
    const selected = Array.from(document.querySelectorAll<HTMLElement>('[data-content-tab][aria-selected="true"]')).find(visible)
    const heading = Array.from(document.querySelectorAll<HTMLElement>('[data-route-heading]')).find(visible)
    const destination = heading ?? selected
    if (destination != null && (focused === document.body || (focused instanceof Element && focused.closest('main') != null))) destination.focus({ preventScroll: true })
  }, [activeTab])
  return null
}
