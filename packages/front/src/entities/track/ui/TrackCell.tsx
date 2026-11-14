import { commonUtils } from '@vk-audiopad/common'
import { Cell, Footnote, Headline, Separator } from '@vkontakte/vkui'
import { useCallback, useEffect, useMemo, useRef, useState, type FC, type HTMLAttributes } from 'react'
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

  const rowProps: HTMLAttributes<HTMLDivElement> = {
    className: `vkap_track_cell${!editMode ? ' vkap_track_cell_contained vkap_track_cell_native' : ''}${removed ? ' vkap_track_cell_removed' : ''}${keyboardFocus ? ' vkap_track_cell_keyboard_focus' : ''}`,
    onFocusCapture: event => { setActionsActivated(true); setKeyboardFocus(event.target.matches(':focus-visible')) },
    onPointerEnter: () => { setActionsActivated(true) },
    onBlurCapture: () => { setKeyboardFocus(false) },
    onPointerDownCapture: () => { setActionsActivated(true); setKeyboardFocus(false) },
    onClick: disabled || removed || onClick == null ? undefined : event => { if (!hasTextSelection(event)) onClick() }
  }
  const titleControl = removed || onClick == null
    ? <span className={removed ? 'vkap_track_cell_muted' : undefined}>{titleText}</span>
    : (
        <Headline
          Component='button'
          level='1'
          weight='3'
          type='button'
          className='vkap_track_title_button vkap_track_cell_heading'
          disabled={disabled}
          aria-label={`${trackState === 'played' ? 'Приостановить' : 'Воспроизвести'} ${titleText}`}
          onClick={event => { event.stopPropagation(); if (!hasTextSelection(event)) onClick() }}
        >{titleText}
        </Headline>
      )
  const cover = <TrackImage imageSrc={image} trackState={trackState} showOverlay={showOverlay} />
  const subtitle = <span inert={removed} className={removed ? 'vkap_track_cell_muted' : undefined}>{artist}</span>
  const tail = (
    <span className={`vkap_track_cell_tail${editMode ? '' : ' vkap_track_cell_after'}`}>
      <span className='vkap_track_cell_actions'>{showActions && actions}</span>
      {!removed && <Duration className='vkap_track_cell_duration' value={duration !== 0 ? commonUtils.toHHMMSS(duration) : ''} />}
    </span>
  )

  if (editMode) return <Cell {...rowProps} Component='div' getRootRef={rootRef} draggable mode='removable' onDragFinish={onDragFinish} onRemove={onRemove} before={<span className={removed ? 'vkap_track_cell_muted' : undefined}>{cover}</span>} after={<><Separator />{tail}</>} subtitle={subtitle}>{titleControl}</Cell>

  return (
    <div {...rowProps} ref={rootRef} role='listitem' data-disabled={disabled || removed || onClick == null || undefined}>
      <div className={`vkap_track_cell_artwork${removed ? ' vkap_track_cell_muted' : ''}`}>{cover}</div>
      <div className='vkap_track_cell_metadata'>
        {removed || onClick == null ? <Headline Component='div' level='1' weight='3' className='vkap_track_cell_heading'>{titleControl}</Headline> : titleControl}
        <Footnote Component='div' inert={removed} className={`vkap_track_cell_subtitle${removed ? ' vkap_track_cell_muted' : ''}`}>{artist}</Footnote>
      </div>
      {tail}
    </div>
  )
}
