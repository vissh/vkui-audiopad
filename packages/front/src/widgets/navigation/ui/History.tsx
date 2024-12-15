import { type commonTypes } from '@vk-audiopad/common'
import { Icon16ChevronOutline } from '@vkontakte/icons'
import { Div, Spacing, Title } from '@vkontakte/vkui'
import { type FC } from 'react'
import { setActiveTab } from '@/shared/model'
import { getTabName } from '../lib/utils'

interface HistoryNavigationProps {
  activeTab: commonTypes.TabWithHistory
}

export const History: FC<HistoryNavigationProps> = ({ activeTab }) => {
  return (
    <Div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        paddingTop: '10px',
        paddingLeft: '10px'
      }}
    >
      {(activeTab.history ?? []).map((tab) => (
        <>
          <Title
            level='3'
            weight='3'
            className='vkap_link vkap_hidden_overflow'
            onClick={() => { setActiveTab(tab) }}
            Component='h3'
            useAccentWeight
          >
            {getTabName(tab)}
          </Title>
          &#8194;
          <Spacing style={{ padding: '4px 0' }}> {/* TODO: VKUI fix https://github.com/VKCOM/VKUI/pull/7035 */}
            <Icon16ChevronOutline className='vkap_secondary_color' />
          </Spacing>
          &#8194;
        </>
      ))}
      <Title
        level='3'
        weight='3'
        className='vkap_hidden_overflow'
        Component='h3'
        useAccentWeight
      >
        {getTabName(activeTab)}
      </Title>
    </Div>
  )
}
