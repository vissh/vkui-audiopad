import { commonUtils } from '@vk-audiopad/common'
import { Cell, Separator } from '@vkontakte/vkui'
import { type FC } from 'react'
import { getText } from '@/shared/lib/cast-to-types'
import { Duration } from '@/shared/ui/duration'
import { type TrackState } from '../model/types'
import './TrackCell.css'
import { TrackImage } from './TrackImage'

interface TrackCellProps {
  title: string
  artist: React.ReactNode
  duration: number
  image: string
  trackState: TrackState
  actions?: React.ReactNode
  removed?: boolean
  editMode?: boolean
  onClick?: () => void
  onAdd?: () => void
  onRemove?: () => void
  onDragFinish?: ({ from, to }: { from: number, to: number }) => void
}

export const TrackCell: FC<TrackCellProps> = ({
  title,
  artist,
  duration,
  image,
  trackState,
  actions,
  editMode = false,
  removed = false,
  onClick,
  onRemove,
  onDragFinish
}) => {
  const disabled = trackState === 'disabled'
  const showOverlay = !editMode || trackState !== 'normal'

  return (
    <Cell
      className={removed ? 'vkap_track_cell vkap_track_cell_removed' : 'vkap_track_cell'}
      draggable={editMode}
      mode={editMode ? 'removable' : undefined}
      onDragFinish={onDragFinish}
      onRemove={onRemove}
      disabled={disabled && !removed}
      onClick={disabled ? undefined : onClick}
      before={
        <span className={removed ? 'vkap_track_cell_muted' : undefined}>
          <TrackImage
            imageSrc={image}
            trackState={trackState}
            showOverlay={showOverlay}
          />
        </span>
      }
      after={
        <>
          <Separator />
          <span className='vkap_track_cell_tail'>
            <span className='vkap_track_cell_actions'>{actions}</span>
            {!removed && (
              <Duration
                className='vkap_track_cell_duration'
                value={(duration !== 0) ? commonUtils.toHHMMSS(duration) : ''}
              />
            )}
          </span>
        </>
      }
      subtitle={<span inert={removed} className={removed ? 'vkap_track_cell_muted' : undefined}>{artist}</span>}
    >
      {removed ? <span className='vkap_track_cell_muted'>{getText(title)}</span> : disabled ? <span className='vkap_secondary_color'>{getText(title)}</span> : getText(title)}
    </Cell>
  )
}
