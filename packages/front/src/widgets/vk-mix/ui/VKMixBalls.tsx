import { useEffect, useState, type FC } from 'react'
import { useInView } from 'react-intersection-observer'
import { useCurrentPlaylist, usePlayed } from '@/entities/active-track'
import './VKMixBalls.css'

interface VKMixBallsProps {
  width: number
  height: number
  active?: boolean
}

export const VKMixBalls: FC<VKMixBallsProps> = ({ width, height, active = true }) => {
  const { ref, inView } = useInView({ fallbackInView: true })
  const [visible, setVisible] = useState(document.visibilityState !== 'hidden')
  const currentPlaylist = useCurrentPlaylist()
  const played = usePlayed()
  const running = active && inView && visible && played && currentPlaylist?.isVkMix === true

  useEffect(() => {
    const update = () => { setVisible(document.visibilityState !== 'hidden') }
    document.addEventListener('visibilitychange', update)
    return () => { document.removeEventListener('visibilitychange', update) }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden='true'
      className={`vkap_mix_visual${running ? ' vkap_mix_visual_running' : ''}`}
      style={{ width, aspectRatio: `${width} / ${height}` }}
    >
      {[0, 1, 2, 3].map(index => <span key={index} className='vkap_mix_glow' />)}
    </div>
  )
}
