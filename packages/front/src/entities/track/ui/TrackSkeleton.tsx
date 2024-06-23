import { Cell, Skeleton } from '@vkontakte/vkui'
import { type FC } from 'react'

export const TrackSkeleton: FC = () => {
  return (
    <Cell
      before={<Skeleton width={48} height={48} />}
      after={<Skeleton width={30} />}
      subtitle={<Skeleton width={75} />}
    >
      <Skeleton width={120} />
    </Cell>
  )
}
