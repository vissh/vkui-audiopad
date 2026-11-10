import { commonUtils } from '@vk-audiopad/common'
import { Cell, Separator, Tappable } from '@vkontakte/vkui'
import { useCallback, useEffect, useMemo, useRef, useState, type FC } from 'react'
import { useOnInView } from 'react-intersection-observer'
import { getText } from '@/shared/lib/cast-to-types'
import { hasTextSelection } from '@/shared/lib/text-selection'
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
  const [actionsActivated, setActionsActivated] = useState(false)
  const eagerActions = editMode || removed || typeof IntersectionObserver === 'undefined'
  const preparationTimer = useRef<number | undefined>(undefined)
  const ref = useOnInView((inView) => {
    window.clearTimeout(preparationTimer.current)
    // Fast scrolling cancels preparation without rerendering passing rows.
    if (inView) preparationTimer.current = window.setTimeout(() => { setActionsActivated(true) }, 150)
  }, { rootMargin: '300px', skip: eagerActions || actionsActivated })
  useEffect(() => () => { window.clearTimeout(preparationTimer.current) }, [])
  const rootRef = useCallback((element: HTMLDivElement | null) => {
    element?.setAttribute('role', 'listitem')
    return ref(element)
  }, [ref])
  const showActions = eagerActions || actionsActivated
  const disabled = trackState === 'disabled'
  const showOverlay = !editMode || trackState !== 'normal'

  return (
    <Cell
      Component='div'
      getRootRef={rootRef}
      className={`vkap_track_cell${!editMode ? ' vkap_track_cell_contained' : ''}${removed ? ' vkap_track_cell_removed' : ''}${keyboardFocus ? ' vkap_track_cell_keyboard_focus' : ''}`}
      onFocusCapture={event => { setActionsActivated(true); setKeyboardFocus(event.target.matches(':focus-visible')) }}
      onPointerEnter={() => { setActionsActivated(true) }}
      onBlurCapture={() => { setKeyboardFocus(false) }}
      onPointerDownCapture={() => { setActionsActivated(true); setKeyboardFocus(false) }}
      draggable={editMode}
      mode={editMode ? 'removable' : undefined}
      onDragFinish={onDragFinish}
      onRemove={onRemove}
      onClick={disabled || removed || onClick == null ? undefined : event => { if (!hasTextSelection(event)) onClick() }}
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
            <span className='vkap_track_cell_actions'>{showActions && actions}</span>
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
            onClick={event => { event.stopPropagation(); if (!hasTextSelection(event)) onClick() }}
          >{titleText}
          </Tappable>}
    </Cell>
  )
}
