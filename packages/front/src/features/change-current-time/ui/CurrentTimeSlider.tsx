import { Slider } from '@vkontakte/vkui'
import { useEffect, useState, type FC } from 'react'
import { useCurrentTime, useDuration } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'

const arrowKeyCodes = new Set(['ArrowLeft', 'ArrowRight'])

export const CurrentTimeSlider: FC = () => {
  const currentTime = useCurrentTime()
  const duration = useDuration()

  const [sliderCurrentTime, setSliderCurrentTime] = useState(0)
  const [mouseDownState, setMouseDownState] = useState(false)

  const mouseDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setMouseDownState(true)
  }

  const mouseUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    sendMessage({ type: 'current-time', value: (sliderCurrentTime * duration) / 100 })
    setMouseDownState(false)
  }

  useEffect(() => {
    if (!mouseDownState) {
      const value = (duration !== 0) ? (currentTime * 100) / duration : 0
      setSliderCurrentTime(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTime, duration])

  return (
    <Slider
      min={0}
      max={100}
      value={sliderCurrentTime}
      onChange={setSliderCurrentTime}
      onPointerDown={mouseDown}
      onPointerUp={mouseUp}
      onKeyDown={(e) => {
        if (!arrowKeyCodes.has(e.code)) {
          return
        }

        let value = (sliderCurrentTime * duration) / 100
        value += e.code === 'ArrowLeft' ? -1 : 1
        sendMessage({ type: 'current-time', value })
      }}
    />
  )
}
