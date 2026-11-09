import { initialState } from '@vk-audiopad/common'
import { Icon24MuteOutline, Icon24VolumeOutline } from '@vkontakte/icons'
import { Snackbar } from '@vkontakte/vkui'
import { useEffect, useRef, useState } from 'react'
import { useAtomValue } from '@/shared/lib/atom'
import { showNotification } from '@/shared/model'
import { PlayerSlider } from '@/shared/ui/player-slider'
import { TooltipIconButton } from '@/shared/ui/tooltip-icon-button'
import { volumeAtom, volumeBeforeMuteAtom } from '../model/atom'

const delayMs = 50

export const VolumeControl = () => {
  const storedVolume = useAtomValue(volumeAtom)
  const storedRestoreVolume = useAtomValue(volumeBeforeMuteAtom)
  const [draft, setDraft] = useState<{ volume: number, remembered: number, committed: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const revision = useRef(0)
  const mounted = useRef(true)
  const volume = draft?.volume ?? storedVolume
  const rememberedVolume = draft?.remembered ?? storedRestoreVolume
  const restoreVolume = Number.isFinite(rememberedVolume) && rememberedVolume > 0 && rememberedVolume <= 1 ? rememberedVolume : initialState.ApplicationControls.volumeBeforeMute

  if (draft?.committed === true && draft.volume === storedVolume && draft.remembered === storedRestoreVolume) setDraft(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      clearTimeout(timer.current)
    }
  }, [])

  const changeVolume = (next: number, delay: number) => {
    clearTimeout(timer.current)
    const remembered = next > 0 ? next : volume > 0 ? volume : restoreVolume
    setDraft({ volume: next, remembered, committed: false })
    const request = ++revision.current
    const save = () => {
      void chrome.storage.local.set({ volume: next, volumeBeforeMute: remembered }).then(() => {
        if (mounted.current && request === revision.current) setDraft(current => current == null ? null : { ...current, committed: true })
      }).catch(() => {
        if (!mounted.current || request !== revision.current) return
        setDraft(null)
        showNotification(<Snackbar onClosed={() => { showNotification(null) }}>Не удалось изменить громкость</Snackbar>)
      })
    }
    if (delay === 0) save()
    else timer.current = setTimeout(save, delay)
  }

  return (
    <>
      <TooltipIconButton
        text={volume === 0 ? 'Включить звук' : 'Выключить звук'}
        icon={volume === 0 ? Icon24MuteOutline : Icon24VolumeOutline}
        onClick={() => { changeVolume(volume === 0 ? restoreVolume : 0, 0) }}
      />
      <PlayerSlider
        aria-label='Громкость'
        getAriaValueText={value => `${value}%`}
        formatValue={value => `${value}%`}
        style={{ width: 72 }}
        min={0}
        max={100}
        step={1}
        value={Math.round(volume * 100)}
        onChange={value => { changeVolume(value / 100, delayMs) }}
      />
    </>
  )
}
