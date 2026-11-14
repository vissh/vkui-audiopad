import { IconButton, Spinner, Tooltip, type IconButtonProps, type TooltipOnShownChange } from '@vkontakte/vkui'
import { useRef, useState, type FC } from 'react'
import './TooltipIconButton.css'

export interface TooltipIconButtonProps {
  text: string
  icon: React.ComponentType<Partial<{ className: string, onClick: (e: React.MouseEvent<SVGSVGElement>) => void }>>
  className?: string
  accent?: boolean
  padding?: boolean
  disabled?: boolean
  busy?: boolean
  pressed?: boolean
  description?: string
  hoverMode?: IconButtonProps['hoverMode']
  activeMode?: IconButtonProps['activeMode']
  tooltipShown?: boolean
  onTooltipShownChange?: TooltipOnShownChange
  suppressTooltipOnClick?: boolean
  onClick?: () => void
}

export const TooltipIconButton: FC<TooltipIconButtonProps> = (props) => {
  const [shown, setShown] = useState(false)
  const suppressRestoredFocus = useRef(false)
  const paddingClassName = (props.padding ?? false) ? 'vkap_tooltip_icon_button_padding' : ''
  const accentClassName = (props.accent ?? false) ? '' : 'vkap_tooltip_icon_button'

  return (
    <Tooltip
      description={props.text}
      hideWhenReferenceHidden={true}
      usePortal={true}
      shown={props.tooltipShown ?? (props.suppressTooltipOnClick ? shown : undefined)}
      onShownChange={props.suppressTooltipOnClick
        ? (shown, reason) => {
            if (shown && reason === 'focus' && suppressRestoredFocus.current) {
              suppressRestoredFocus.current = false
              return
            }
            setShown(shown)
            props.onTooltipShownChange?.(shown, reason)
          }
        : props.onTooltipShownChange}
    >
      <IconButton
        label={props.text}
        disabled={props.disabled}
        hasHover={props.hoverMode != null && props.hoverMode !== 'none'}
        hasActive={props.activeMode != null && props.activeMode !== 'none'}
        hoverMode={props.hoverMode ?? 'none'}
        activeMode={props.activeMode ?? 'none'}
        aria-disabled={props.disabled || props.busy || undefined}
        aria-busy={props.busy || undefined}
        aria-pressed={props.pressed}
        aria-description={props.description}
        className={`vkap_icon_action ${accentClassName} ${paddingClassName} ${props.className ?? ''}`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          if (!props.disabled && !props.busy && props.onClick != null) {
            if (props.suppressTooltipOnClick) {
              suppressRestoredFocus.current = true
              setShown(false)
            }
            props.onClick()
          }
        }}
      >
        <span className='vkap_icon_action_content' aria-hidden='true'>
          <props.icon className='vkap_icon_action_glyph' />
          {props.busy && <span className='vkap_icon_action_spinner'><Spinner size='s' /></span>}
        </span>
      </IconButton>
    </Tooltip>
  )
}
