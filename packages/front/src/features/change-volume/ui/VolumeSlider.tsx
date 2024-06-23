import { FormItem, Slider } from '@vkontakte/vkui'
import { useEffect, useState, type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { useDebounce } from '@/shared/lib/hooks'
import { volumeAtom } from '../model/atom'

const delayMs = 50

export const VolumeSlider: FC = () => {
  const [volume, setVolume] = useAtom(volumeAtom)
  const [sliderVolume, setSliderVolume] = useState(100)

  useEffect(() => {
    setSliderVolume(Math.round(volume * 100))
  }, [volume])

  const setVolumeToStorage = useDebounce((value: number) => { setVolume(value) }, delayMs)

  const changeVolume = (value: number) => {
    setSliderVolume(value)
    setVolumeToStorage(value / 100)
  }

  return (
    <FormItem>
      <Slider
        withTooltip
        size='s'
        style={{ width: 100 }}
        min={0}
        max={100}
        step={1}
        value={sliderVolume}
        onChange={changeVolume}
      />
    </FormItem>
  )
}
