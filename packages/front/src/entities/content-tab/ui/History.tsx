import { type commonTypes } from '@vk-audiopad/common'
import { Icon16ChevronOutline } from '@vkontakte/icons'
import { Div, Spacing, Title } from '@vkontakte/vkui'
import { type FC } from 'react'
import { getTabName } from '../lib/utils'
import { selectedTabAtom } from '../model/atom'

interface HistoryNavigationProps {
  selectedTab: commonTypes.TabWithHistory
}

export const History: FC<HistoryNavigationProps> = ({ selectedTab }) => {
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
      {(selectedTab.history ?? []).map((tab) => (
        <>
          <Title
            level='3'
            weight='3'
            className='vkap_link vkap_hidden_overflow'
            onClick={() => { selectedTabAtom.set(tab) }}
          >
            {getTabName(tab)}
          </Title>
          &#8194;
          <Spacing>
            <Icon16ChevronOutline className='vkap_secondary_color' />
          </Spacing>
          &#8194;
        </>
      ))}

      <Title
        level='3'
        weight='3'
        className='vkap_hidden_overflow'
      >
        {getTabName(selectedTab)}
      </Title>
    </Div>
  )
}
