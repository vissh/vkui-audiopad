import { Tooltip } from '@vkontakte/vkui'
import { type FC } from 'react'
import './TooltipIconButton.css'

export interface TooltipIconButtonProps {
  text: string
  icon: React.ComponentType<Partial<{ className: string, onClick: (e: React.MouseEvent<SVGSVGElement>) => void }>>
  accent?: boolean
  padding?: boolean
  onClick?: () => void
}

export const TooltipIconButton: FC<TooltipIconButtonProps> = (props) => {
  const paddingClassName = (props.padding ?? false) ? 'vkap_tooltip_icon_button_padding' : ''
  const accentClassName = (props.accent ?? false) ? '' : 'vkap_tooltip_icon_button'

  return (
    <Tooltip
      text={props.text}
      hideWhenReferenceHidden={true}
      usePortal={true}
    >
      <props.icon
        className={`${accentClassName} ${paddingClassName}`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation()
          if (props.onClick != null) {
            props.onClick()
          }
        }}
      />
    </Tooltip>
  )
}
