import { Slider, Tooltip, type SliderProps } from '@vkontakte/vkui'
import { memo, useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import './PlayerSlider.css'

type PlayerSliderProps = Omit<SliderProps, 'withTooltip' | 'size' | 'getRootRef' | 'defaultValue' | 'multiple'> & {
  value: number
  formatValue: (value: number) => string
}

const SliderControl = memo(Slider)

export const PlayerSlider = ({ value, formatValue, min = 0, max = 100, step = 1, disabled, className, style, ...props }: PlayerSliderProps) => {
  const [hover, setHover] = useState<{ ratio: number, offset: number } | null>(null)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const frame = useRef<number | undefined>(undefined)
  const pointer = useRef<{ element: HTMLDivElement, x: number } | null>(null)
  const cancelPreview = useCallback(() => {
    if (frame.current !== undefined) window.cancelAnimationFrame(frame.current)
    frame.current = undefined
    pointer.current = null
  }, [])
  useEffect(() => cancelPreview, [cancelPreview, disabled, min, max])
  const hoveredValue = hover == null ? value : min + Math.round(hover.ratio * (max - min) / step) * step
  const previewValue = Math.max(min, Math.min(max, hoveredValue))

  const previewAt = (element: HTMLDivElement, clientX: number) => {
    const rect = element.getBoundingClientRect()
    if (rect.width === 0) return
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left))
    const next = { ratio: x / rect.width, offset: x - rect.width / 2 }
    setHover(previous => previous?.ratio === next.ratio && previous.offset === next.offset ? previous : next)
  }

  const preview = (event: PointerEvent<HTMLDivElement>) => {
    cancelPreview()
    if (disabled || max <= min || event.pointerType === 'touch') return
    previewAt(event.currentTarget, event.clientX)
  }

  const movePreview = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || dismissed || max <= min || event.pointerType === 'touch') return
    pointer.current = { element: event.currentTarget, x: event.clientX }
    if (frame.current !== undefined) return
    frame.current = window.requestAnimationFrame(() => {
      frame.current = undefined
      const latest = pointer.current
      pointer.current = null
      if (latest != null) previewAt(latest.element, latest.x)
    })
  }

  return (
    <Tooltip
      description={formatValue(previewValue)}
      shown={!disabled && max > min && !dismissed && (hover != null || keyboardFocus)}
      onShownChange={(shown, reason) => { if (!shown && reason === 'escape-key') { cancelPreview(); setDismissed(true) } }}
      placement='bottom'
      offsetByMainAxis={4}
      offsetByCrossAxis={hover?.offset ?? 0}
      disableTriggerOnFocus
      disableCloseAfterClick
      usePortal
    >
      <div
        className={`vkap_player_slider${keyboardFocus && !disabled ? ' vkap_player_slider_focus' : ''} ${className ?? ''}`}
        style={style}
        onPointerEnter={event => { setDismissed(false); preview(event) }}
        onPointerMove={movePreview}
        onPointerLeave={() => { cancelPreview(); setHover(null) }}
        onPointerDownCapture={event => { setKeyboardFocus(false); setDismissed(false); preview(event) }}
        onPointerCancelCapture={() => { cancelPreview(); setHover(null) }}
        onFocusCapture={event => { setKeyboardFocus(event.target.matches(':focus-visible')); setDismissed(false) }}
        onBlurCapture={() => { setKeyboardFocus(false) }}
        onKeyDownCapture={event => {
          if (event.key === 'Escape') return
          cancelPreview()
          setHover(null)
          setKeyboardFocus(true)
          setDismissed(false)
        }}
      >
        <SliderControl {...props} className='vkap_player_slider_control' size='s' min={min} max={max} step={step} disabled={disabled} value={value} />
      </div>
    </Tooltip>
  )
}
