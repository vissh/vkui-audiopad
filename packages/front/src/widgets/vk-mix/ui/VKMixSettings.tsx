import { useQuery } from '@tanstack/react-query'
import { vkApiClient, vkMix } from '@vk-audiopad/common'
import { Icon16Cancel, Icon20SlidersOutline } from '@vkontakte/icons'
import { AppRootPortal, Button, ButtonGroup, Caption, ModalCard, Placeholder, Skeleton, SubnavigationBar, SubnavigationButton } from '@vkontakte/vkui'
import { useState } from 'react'
import { useCurrentPlaylist } from '@/entities/active-track'
import { useMixPreferences } from '@/entities/vk-mix'
import { playMix } from '../model/play-mix'
import './VKMixSettings.css'

export const VKMixSettings = ({ userId }: { userId: string }) => {
  const [open, setOpen] = useState(false)
  const current = useCurrentPlaylist()
  const remembered = useMixPreferences(userId)
  const common = current?.isVkMix === true && (current.mixId ?? 'common') === 'common' ? current : null
  const options = remembered?.options ?? common?.mixOptions
  const title = remembered?.title || common?.title || 'VK Микс'
  const configured = options != null && options.length > 0 && title !== 'VK Микс'
  return (
    <>
      <div className={`vkap_mix_settings_trigger${configured ? ' vkap_mix_settings_configured' : ''}`}>
        <Button size='m' mode='secondary' before={<Icon20SlidersOutline />} aria-label='Настроить VK Микс' onClick={() => { setOpen(true) }}>{configured ? title : 'Настроить'}</Button>
        {configured && <Button size='m' mode='tertiary' aria-label='Сбросить настройки VK Микса' onClick={() => { playMix(userId) }}><Icon16Cancel /></Button>}
      </div>
      <AppRootPortal usePortal>
        <ModalCard open={open} onClose={() => { setOpen(false) }} title='Настроить VK Микс' className='vkap_mix_settings' dismissLabel='Закрыть настройки VK Микса'>
          {open && <SettingsContent userId={userId} options={options} currentTitle={title} onApplied={() => { setOpen(false) }} />}
        </ModalCard>
      </AppRootPortal>
    </>
  )
}

const SettingsContent = ({ userId, options, currentTitle, onApplied }: { userId: string, options?: string, currentTitle?: string, onApplied: () => void }) => {
  const query = useQuery({ queryKey: ['mix-settings', userId], queryFn: async ({ signal }) => await vkApiClient.getStreamMixSettings(userId, signal), retry: false, networkMode: 'always', refetchOnWindowFocus: false, refetchOnReconnect: false })
  if (query.isPending) return <div className='vkap_mix_settings_loading' aria-label='Загрузка настроек VK Микса'>{[0, 1, 2].map(i => <div key={i}><Skeleton width={130} height={14} /><Skeleton width='100%' height={34} /></div>)}</div>
  if (query.isError) return <Placeholder title='Не удалось загрузить настройки' action={<Button onClick={() => { void query.refetch() }}>Повторить</Button>}>Проверьте соединение и попробуйте ещё раз</Placeholder>
  return <SettingsForm settings={query.data} options={options} currentTitle={currentTitle} userId={userId} onApplied={onApplied} />
}

const SettingsForm = ({ settings, options, currentTitle, userId, onApplied }: { settings: vkMix.MixSettings, options?: string, currentTitle?: string, userId: string, onApplied: () => void }) => {
  const [selection, setSelection] = useState(() => vkMix.selectionFromOptions(settings, options))
  const labels = settings.categories.flatMap(category => category.options.filter(option => selection[category.id]?.includes(option.id)).map(option => option.title))
  const apply = (): void => {
    const title = [...(selection.additionals?.length && currentTitle ? [currentTitle.split(' · ')[0]] : []), ...labels].join(' · ') || 'VK Микс'
    playMix(userId, vkMix.serializeOptions(selection), title)
    onApplied()
  }
  return (
    <div className='vkap_mix_settings_form'>
      {settings.subtitle && <p>{settings.subtitle}</p>}
      {settings.categories.map(category => (
        <section key={category.id} aria-label={category.title}>
          <Caption caps weight='1' className='vkap_mix_settings_label'>{category.title}</Caption>
          <SubnavigationBar fixed={category.options.length < 4} showArrows>
            {category.options.map(option => <SubnavigationButton key={option.id} selected={selection[category.id]?.includes(option.id)} aria-pressed={selection[category.id]?.includes(option.id) ?? false} onClick={() => { setSelection(previous => vkMix.toggleOption(settings, previous, category.id, option.id)) }}>{option.title}</SubnavigationButton>)}
          </SubnavigationBar>
        </section>
      ))}
      <ButtonGroup stretched align='right' gap='m' className='vkap_mix_settings_actions'>
        <Button size='m' mode='tertiary' onClick={() => { setSelection({}) }}>Сбросить</Button>
        <Button size='m' onClick={apply}>Применить</Button>
      </ButtonGroup>
    </div>
  )
}
