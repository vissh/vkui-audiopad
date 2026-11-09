import { Slider, Tooltip, type SliderProps } from '@vkontakte/vkui'
import { useState, type PointerEvent } from 'react'
import './PlayerSlider.css'

type PlayerSliderProps = Omit<SliderProps, 'withTooltip' | 'size' | 'getRootRef' | 'defaultValue' | 'multiple'> & {
  value: number
  formatValue: (value: number) => string
}

export const PlayerSlider = ({ value, formatValue, min = 0, max = 100, step = 1, disabled, className, style, ...props }: PlayerSliderProps) => {
  const [hover, setHover] = useState<{ ratio: number, offset: number } | null>(null)
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const hoveredValue = hover == null ? value : min + Math.round(hover.ratio * (max - min) / step) * step
  const previewValue = Math.max(min, Math.min(max, hoveredValue))

  const preview = (event: PointerEvent<HTMLDivElement>) => {
    if (disabled || max <= min || event.pointerType === 'touch') return
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0) return
    const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
    setHover({ ratio: x / rect.width, offset: x - rect.width / 2 })
  }

  return (
    <Tooltip
      description={formatValue(previewValue)}
      shown={!disabled && max > min && !dismissed && (hover != null || keyboardFocus)}
      onShownChange={(shown, reason) => { if (!shown && reason === 'escape-key') setDismissed(true) }}
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
        onPointerMove={preview}
        onPointerLeave={() => { setHover(null) }}
        onPointerDownCapture={event => { setKeyboardFocus(false); setDismissed(false); preview(event) }}
        onPointerCancelCapture={() => { setHover(null) }}
        onFocusCapture={event => { setKeyboardFocus(event.target.matches(':focus-visible')); setDismissed(false) }}
        onBlurCapture={() => { setKeyboardFocus(false) }}
        onKeyDownCapture={event => {
          if (event.key === 'Escape') return
          setHover(null)
          setKeyboardFocus(true)
          setDismissed(false)
        }}
      >
        <Slider {...props} className='vkap_player_slider_control' size='s' min={min} max={max} step={step} disabled={disabled} value={value} />
      </div>
    </Tooltip>
  )
}
