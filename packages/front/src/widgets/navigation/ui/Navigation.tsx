import { commonUtils } from '@vk-audiopad/common'
import { Div, Flex } from '@vkontakte/vkui'
import { memo, type FC } from 'react'
import { SearchInput } from '@/features/search'
import { useActiveTab } from '@/shared/model'
import { ActionTabs } from './ActionTabs'
import { ContentTabs } from './ContentTabs'
import { History } from './History'

interface NavigationProps {
  children?: React.ReactNode
  noPaddingBottom?: boolean
}

export const Navigation: FC<NavigationProps> = ({ children, noPaddingBottom = false }) => {
  const activeTab = useActiveTab()

  return (
    <>
      {commonUtils.isTabWithHistory(activeTab) ? <History activeTab={activeTab} /> : <ApplicationTabs />}
      {children != null && children}
      {children == null && <Div
        style={{
          paddingTop: '8px',
          paddingBottom: noPaddingBottom ? 'unset' : '8px'
        }}>
        <SearchInput />
      </Div>}
    </>
  )
}

const ApplicationTabs = memo(function ApplicationTabs () {
  return (
    <Flex justify='space-between' noWrap>
      <ContentTabs />
      <ActionTabs />
    </Flex>
  )
})
