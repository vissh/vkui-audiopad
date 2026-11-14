import { Icon28SongOutline, Icon32PauseCircle, Icon32PlayCircle } from '@vkontakte/icons'
import { memo, useState } from 'react'
import { type TrackState } from '../model/types'
import './TrackImage.css'

interface TrackImageProps {
  imageSrc: string
  trackState: TrackState
  showOverlay?: boolean
}

export const TrackImage = memo(function TrackImage ({ imageSrc, trackState, showOverlay = true }: TrackImageProps) {
  const [image, setImage] = useState<{ src: string, loaded: boolean } | null>(null)
  const loaded = image?.src === imageSrc && image.loaded
  const failed = image?.src === imageSrc && !image.loaded
  const visible = trackState !== 'normal'

  return (
    <span aria-hidden='true' className={`vkap_track_cover${loaded ? ' vkap_track_cover_loaded' : ''}`}>
      {imageSrc.length > 0 && (
        <img
          key={imageSrc}
          src={imageSrc}
          alt=''
          width={48}
          height={48}
          loading='lazy'
          className={failed ? 'vkap_track_cover_failed' : undefined}
          onLoad={() => { setImage({ src: imageSrc, loaded: true }) }}
          onError={() => { setImage({ src: imageSrc, loaded: false }) }}
        />
      )}
      {showOverlay && imageSrc.length === 0 && <Icon28SongOutline />}
      {showOverlay && (
        <span className={`vkap_track_cover_overlay${visible ? ' vkap_track_cover_overlay_visible' : ''}${trackState === 'disabled' ? ' vkap_track_cover_overlay_disabled' : ''}`}>
          {trackState === 'played' && <Icon32PauseCircle width={32} height={32} fill='white' />}
          {(trackState === 'paused' || trackState === 'normal') && <Icon32PlayCircle width={32} height={32} fill='white' />}
        </span>
      )}
    </span>
  )
})
