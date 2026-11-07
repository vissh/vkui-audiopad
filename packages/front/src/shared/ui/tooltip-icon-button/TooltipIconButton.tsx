import { IconButton, Spinner, Tooltip, type IconButtonProps, type TooltipOnShownChange } from '@vkontakte/vkui'
import { type FC } from 'react'
import './TooltipIconButton.css'

export interface TooltipIconButtonProps {
  text: string
  icon: React.ComponentType<Partial<{ className: string, onClick: (e: React.MouseEvent<SVGSVGElement>) => void }>>
  className?: string
  accent?: boolean
  padding?: boolean
  disabled?: boolean
  busy?: boolean
  hoverMode?: IconButtonProps['hoverMode']
  activeMode?: IconButtonProps['activeMode']
  tooltipShown?: boolean
  onTooltipShownChange?: TooltipOnShownChange
  onClick?: () => void
}

export const TooltipIconButton: FC<TooltipIconButtonProps> = (props) => {
  const paddingClassName = (props.padding ?? false) ? 'vkap_tooltip_icon_button_padding' : ''
  const accentClassName = (props.accent ?? false) ? '' : 'vkap_tooltip_icon_button'

  return (
    <Tooltip
      description={props.text}
      hideWhenReferenceHidden={true}
      usePortal={true}
      shown={props.tooltipShown}
      onShownChange={props.onTooltipShownChange}
    >
      <IconButton
        label={props.text}
        disabled={props.disabled}
        hoverMode={props.hoverMode}
        activeMode={props.activeMode}
        aria-disabled={props.disabled || props.busy || undefined}
        aria-busy={props.busy || undefined}
        className={`vkap_icon_action ${accentClassName} ${paddingClassName} ${props.className ?? ''}`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          if (!props.disabled && !props.busy && props.onClick != null) {
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
