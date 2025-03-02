import { Icon24GearOutline, Icon24LikeOutline, Icon28LikeFillRed } from '@vkontakte/icons'
import { Badge, Tabs, TabsItem } from '@vkontakte/vkui'
import { type FC, useEffect, useRef } from 'react'
import { setLikeModal, setSettingsModal } from '@/entities/modal'
import { updateLikeState, updateSettingsState, useLikeNewVersion, useSettingsNewVersion } from '../model/atom'

export const ActionTabs: FC = () => {
  const likeNewVersion = useLikeNewVersion()
  const settingsNewVersion = useSettingsNewVersion()
  const settingsStatusRef = useRef<HTMLInputElement>(null)

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
      <TabsItem
        id='tab-settings'
        aria-controls='tab-settings'
        style={{ padding: '0px 0px' }}
        hovered={false}
        before={<Icon24GearOutline />}
        status={settingsNewVersion ? <Badge getRootRef={settingsStatusRef} style={{ marginLeft: '-8px', marginTop: '-14px' }} /> : undefined}
        onClick={() => {
          setSettingsModal()
          updateSettingsState()
        }}
      />
    </Tabs>
  )
}
