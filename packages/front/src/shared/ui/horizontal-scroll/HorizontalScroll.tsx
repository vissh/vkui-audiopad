import { HorizontalScroll as VKUIHorizontalScroll, type HorizontalScrollProps } from '@vkontakte/vkui'
import { useCallback, useRef, useState, type RefObject } from 'react'
import './HorizontalScroll.css'

type Props = Omit<HorizontalScrollProps, 'slotProps' | 'getRootRef'>

export const HorizontalScroll = ({ showArrows = true, onFocusCapture, onBlurCapture, ...props }: Props) => {
  const root = useRef<HTMLDivElement>(null)
  const [focusWithin, setFocusWithin] = useState(false)
  const previousArrow = useArrowFocus(root)
  const nextArrow = useArrowFocus(root)

  return (
    <VKUIHorizontalScroll
      {...props}
      className={`vkap_horizontal_scroll ${props.className ?? ''}`}
      role={props.role ?? 'group'}
      aria-label={props['aria-label'] ?? 'Прокрутка по горизонтали'}
      tabIndex={props.tabIndex ?? -1}
      getRootRef={root}
      showArrows={showArrows === false ? false : focusWithin ? 'always' : showArrows}
      onFocusCapture={event => {
        setFocusWithin(true)
        onFocusCapture?.(event)
      }}
      onBlurCapture={event => {
        if (!(event.relatedTarget instanceof Node) || !event.currentTarget.contains(event.relatedTarget)) setFocusWithin(false)
        onBlurCapture?.(event)
      }}
      slotProps={{
        prevArrow: { 'aria-hidden': false, tabIndex: 0, getRootRef: previousArrow },
        nextArrow: { 'aria-hidden': false, tabIndex: 0, getRootRef: nextArrow }
      }}
    />
  )
}

const useArrowFocus = (root: RefObject<HTMLDivElement | null>) => {
  const arrow = useRef<HTMLButtonElement | null>(null)
  return useCallback((element: HTMLButtonElement | null) => {
    if (element == null && arrow.current === document.activeElement && root.current?.isConnected) root.current.focus({ preventScroll: true })
    arrow.current = element
  }, [root])
}
