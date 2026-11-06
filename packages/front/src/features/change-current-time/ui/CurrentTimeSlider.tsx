import { commonTypes, commonUtils } from '@vk-audiopad/common'
import { useState, type FC } from 'react'
import { useCurrentTime, useDuration } from '@/entities/active-track'
import { sendMessage } from '@/shared/lib/send-message'
import { PlayerSlider } from '@/shared/ui/player-slider'

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

  const sliderCurrentTime = Math.max(0, Math.min(duration, sliderValue ?? currentTime))
  const commit = (value: number) => {
    sendMessage({
      target: commonTypes.MessageTarget.SERVICE_WORKER,
      type: commonTypes.MessageType.CURRENT_TIME,
      value
    })
  }

  const mouseDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
  }

  const mouseUp = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    commit(sliderCurrentTime)
    // keep the dragged position until the next playback tick overrides it
    setDragging(false)
  }

  return (
    <PlayerSlider
      aria-label='Позиция воспроизведения'
      getAriaValueText={value => `${commonUtils.toHHMMSS(value)} из ${commonUtils.toHHMMSS(duration)}`}
      formatValue={commonUtils.toHHMMSS}
      min={0}
      max={duration || 1}
      step={1}
      disabled={duration <= 0}
      value={sliderCurrentTime}
      onChange={(value, event) => {
        setSliderValue(value)
        if ('target' in event && event.target instanceof HTMLInputElement) commit(value)
      }}
      onPointerDown={duration > 0 ? mouseDown : undefined}
      onPointerUp={duration > 0 ? mouseUp : undefined}
      onPointerCancel={() => {
        setDragging(false)
        setSliderValue(null)
      }}
    />
  )
}
