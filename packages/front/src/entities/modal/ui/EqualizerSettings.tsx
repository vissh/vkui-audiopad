import { equalizer } from '@vk-audiopad/common'
import { Icon16MusicOutline, Icon28SlidersVerticalOutline } from '@vkontakte/icons'
import { Footnote, Group, SimpleCell, Switch } from '@vkontakte/vkui'
import { useId, useState } from 'react'
import { useAtom, useAtomValue } from '@/shared/lib/atom'
import { equalizerPresetLabels, equalizerSettingsAtom, equalizerStatusAtom, selectedEqualizerPreset } from '../model/equalizer'
import { EqualizerMixAccess } from './EqualizerMixAccess'
import { EqualizerPanel } from './EqualizerPanel'

export const EqualizerSettings = ({ onAccessDialogChange }: { onAccessDialogChange?: (open: boolean) => void }) => {
  const id = useId()
  const [accessRequest, setAccessRequest] = useState(0)
  const [stored, setSettings] = useAtom(equalizerSettingsAtom)
  const settings = equalizer.normalize(stored)
  const status = useAtomValue(equalizerStatusAtom)
  const selected = selectedEqualizerPreset(settings)
  const curve = equalizerPresetLabels[selected] ?? settings.userPresets.find(preset => `user:${preset.id}` === selected)?.name

  return (
    <>
      {settings.enabled && (status === 'loading' || status === 'unavailable') && (
        <div className='vkap_equalizer_track_status' role='status' aria-label='Состояние текущего трека'>
          <Icon16MusicOutline />
          <div>
            <Footnote>{status === 'loading' ? 'Подготовка звука…' : 'Этот трек играет без эквалайзера'}</Footnote>
          </div>
        </div>
      )}
      <Group>
        <SimpleCell
          before={<Icon28SlidersVerticalOutline />}
          subtitle={settings.enabled ? undefined : curve}
          after={
            <Switch
              slotProps={{ input: { 'aria-label': 'Включить эквалайзер', 'aria-controls': id } }}
              checked={settings.enabled}
              onChange={event => {
                setSettings({ ...settings, enabled: event.target.checked })
                if (event.target.checked) setAccessRequest(value => value + 1)
              }}
            />
          }
          hasHover={false}
          hasActive={false}
        >
          Эквалайзер
        </SimpleCell>
        <div id={id}>
          <EqualizerMixAccess
            enabled={settings.enabled}
            requestVersion={accessRequest}
            denied={settings.mixAccessDenied === true}
            onDialogChange={onAccessDialogChange}
          />
          {settings.enabled && <EqualizerPanel />}
        </div>
      </Group>
    </>
  )
}
