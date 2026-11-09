import { commonUtils } from '@vk-audiopad/common'
import { Cell, Separator, Tappable } from '@vkontakte/vkui'
import { useMemo, useState, type FC } from 'react'
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
  const titleText = useMemo(() => getText(title), [title])
  const [keyboardFocus, setKeyboardFocus] = useState(false)
  const disabled = trackState === 'disabled'
  const showOverlay = !editMode || trackState !== 'normal'

  return (
    <Cell
      Component='div'
      getRootRef={element => { element?.setAttribute('role', 'listitem') }}
      className={`vkap_track_cell${removed ? ' vkap_track_cell_removed' : ''}${keyboardFocus ? ' vkap_track_cell_keyboard_focus' : ''}`}
      onFocusCapture={event => { setKeyboardFocus(event.target.matches(':focus-visible')) }}
      onBlurCapture={() => { setKeyboardFocus(false) }}
      onPointerDownCapture={() => { setKeyboardFocus(false) }}
      draggable={editMode}
      mode={editMode ? 'removable' : undefined}
      onDragFinish={onDragFinish}
      onRemove={onRemove}
      onClick={disabled || removed ? undefined : onClick}
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
      {removed || onClick == null
        ? <span className={removed ? 'vkap_track_cell_muted' : undefined}>{titleText}</span>
        : <Tappable
            Component='button'
            type='button'
            className='vkap_track_title_button'
            hoverMode='none'
            activeMode='none'
            disabled={disabled}
            aria-label={`${trackState === 'played' ? 'Приостановить' : 'Воспроизвести'} ${titleText}`}
            onClick={event => { event.stopPropagation(); onClick() }}
          >{titleText}
          </Tappable>}
    </Cell>
  )
}
