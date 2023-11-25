import { Headline } from '@vkontakte/vkui'
import { type FC } from 'react'

interface DurationProps {
  value: string
  className?: string | undefined
}

export const Duration: FC<DurationProps> = ({ value, className }) => {
  return (
    <Headline
      className={className}
      level='1'
      style={{ color: 'var(--vkui--color_text_secondary)' }}
    >
      {value}
    </Headline>
  )
}
