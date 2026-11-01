import { FormItem, Slider } from '@vkontakte/vkui'
import { useState, type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { useDebounce } from '@/shared/lib/hooks'
import { volumeAtom } from '../model/atom'

const delayMs = 50

export const VolumeSlider: FC = () => {
  const [volume, setVolume] = useAtom(volumeAtom)
  const [sliderValue, setSliderValue] = useState<number | null>(null)
  // drop local override once the stored volume catches up
  const [syncedVolume, setSyncedVolume] = useState(volume)
  if (volume !== syncedVolume) {
    setSyncedVolume(volume)
    setSliderValue(null)
  }

  const sliderVolume = sliderValue ?? Math.round(volume * 100)

  const setVolumeToStorage = useDebounce((value: number) => { setVolume(value) }, delayMs)

  const changeVolume = (value: number) => {
    setSliderValue(value)
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
