import { commonTypes } from '@vk-audiopad/common'
import { Slider } from '@vkontakte/vkui'
import { useState, type FC } from 'react'
import { useCurrentTime, useDuration } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'

const arrowKeyCodes = new Set(['ArrowLeft', 'ArrowRight'])

export const CurrentTimeSlider: FC = () => {
  const currentTime = useCurrentTime()
  const duration = useDuration()

  const [sliderValue, setSliderValue] = useState<number | null>(null)
  const [dragging, setDragging] = useState(false)
  // drop local override once playback position catches up,
  // but never while the user is holding the slider
  const [syncedTime, setSyncedTime] = useState(currentTime)
  if (currentTime !== syncedTime) {
    setSyncedTime(currentTime)
    if (!dragging) {
      setSliderValue(null)
    }
  }

  const sliderCurrentTime = sliderValue ?? ((duration !== 0) ? (currentTime * 100) / duration : 0)

  const mouseDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const mouseUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.CURRENT_TIME,
      value: (sliderCurrentTime * duration) / 100
    })
    // keep the dragged position until the next playback tick overrides it
    setDragging(false)
  }

  return (
    <Slider
      size='s'
      min={0}
      max={100}
      value={sliderCurrentTime}
      onChange={setSliderValue}
      onPointerDown={mouseDown}
      onPointerUp={mouseUp}
      onKeyDown={(e) => {
        if (!arrowKeyCodes.has(e.code)) {
          return
        }

        let value = (sliderCurrentTime * duration) / 100
        value += e.code === 'ArrowLeft' ? -1 : 1
        sendMessage({
          target: commonTypes.MessageTarget.SERVICE_WORKER,
          type: commonTypes.MessageType.CURRENT_TIME,
          value
        })
      }}
    />
  )
}
