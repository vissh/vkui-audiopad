import { Icon16Cancel, Icon24GearOutline, Icon24LikeOutline, Icon28LikeFillRed } from '@vkontakte/icons'
import { Badge, Footnote, IconButton, Popover, Tabs, TabsItem, Text } from '@vkontakte/vkui'
import { type FC, useEffect, useRef } from 'react'
import { setLikeModal, setSettingsModal } from '@/entities/modal'
import { updateLikeState, updateSettingsState, useLikeNewVersion, useSettingsNewVersion } from '../model/atom'
import { useEqualizerHint } from '../model/equalizer-hint'
import './ActionTabs.css'

export const ActionTabs: FC = () => {
  const likeNewVersion = useLikeNewVersion()
  const settingsNewVersion = useSettingsNewVersion()
  const settingsStatusRef = useRef<HTMLInputElement>(null)
  const { hint, shown, close } = useEqualizerHint()

  useEffect(() => {
    if (settingsStatusRef?.current?.parentElement != null) {
      settingsStatusRef.current.parentElement.style.marginLeft = '0px'
    }
  }, [])

  return (
    <Tabs mode='accent' layoutFillMode='shrinked'>
      <TabsItem
        id='tab-like'
        aria-controls='tab-like'
        style={{ padding: '0px 0px' }}
        hovered={false}
        before={likeNewVersion ? <Icon28LikeFillRed /> : <Icon24LikeOutline />}
        onClick={() => {
          setLikeModal()
          updateLikeState()
        }}
      />
      <Popover
        role='region'
        aria-label='Подсказка настроек'
        trigger='manual'
        shown={shown}
        placement='top-end'
        arrow
        autoFocus={false}
        restoreFocus={false}
        disableFocusTrap
        hideWhenReferenceHidden
        onShownChange={shown => { if (!shown) close() }}
        content={
          <div className='vkap_settings_hint' role='status'>
            <IconButton className='vkap_settings_hint_close' aria-label='Закрыть подсказку' onClick={close}><Icon16Cancel /></IconButton>
            <Text weight='2'>{hint === 'access' ? 'Эквалайзеру нужен доступ' : 'Доступен эквалайзер'}</Text>
            <Footnote className='vkap_settings_hint_description'>{hint === 'access' ? 'Для обработки музыки с okcdn.ru выдайте доступ в настройках звука' : 'Настройте звучание в разделе «Звук» в настройках'}</Footnote>
          </div>
        }
      >
        <TabsItem
          id='tab-settings'
          aria-label='Настройки'
          aria-controls='tab-settings'
          style={{ padding: '0px 0px' }}
          hovered={false}
          before={<Icon24GearOutline />}
          status={settingsNewVersion ? <Badge getRootRef={settingsStatusRef} style={{ marginLeft: '-8px', marginTop: '-14px' }} /> : undefined}
          onClick={() => {
            close()
            setSettingsModal()
            updateSettingsState()
          }}
        />
      </Popover>
    </Tabs>
  )
}
