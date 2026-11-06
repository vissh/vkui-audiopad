import { type commonTypes } from '@vk-audiopad/common'
import { Icon16ChevronOutline } from '@vkontakte/icons'
import { Div, Link, Spacing, Title } from '@vkontakte/vkui'
import { Fragment, type FC, type ReactNode } from 'react'
import { setActiveTab } from '@/shared/model'
import { getTabName } from '../lib/utils'

interface HistoryNavigationProps {
  activeTab: commonTypes.TabWithHistory
  after?: ReactNode
}

export const History: FC<HistoryNavigationProps> = ({ activeTab, after }) => {
  return (
    <Div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: '10px',
        paddingLeft: '10px'
      }}
    >
      {(activeTab.history ?? []).map((tab, index) => (
        <Fragment key={`${tab.tab}-${index}`}>
          <Title
            level='3'
            weight='3'
            className='vkap_link vkap_hidden_overflow'
            Component='span'
            useAccentWeight
          >
            <Link Component='button' type='button' className='vkap_link' onClick={() => { setActiveTab(tab) }}>{getTabName(tab)}</Link>
          </Title>
          &#8194;
          <Spacing style={{ padding: '4px 0' }}> {/* TODO: VKUI fix https://github.com/VKCOM/VKUI/pull/7035 */}
            <Icon16ChevronOutline className='vkap_secondary_color' />
          </Spacing>
          &#8194;
        </Fragment>
      ))}
      <Title
        level='3'
        weight='3'
        className='vkap_hidden_overflow'
        Component='h1'
        tabIndex={-1}
        data-route-heading
        useAccentWeight
      >
        {getTabName(activeTab)}
      </Title>
      {after}
    </Div>
  )
}
