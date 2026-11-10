import { commonUtils } from '@vk-audiopad/common'
import { Div, Flex, VisuallyHidden } from '@vkontakte/vkui'
import { memo, type ReactNode } from 'react'
import { SearchInput } from '@/features/search'
import { useActiveTab } from '@/shared/model'
import { getTabName } from '../lib/utils'
import { ActionTabs } from './ActionTabs'
import { ContentTabs } from './ContentTabs'
import { History } from './History'

interface NavigationProps {
  children?: React.ReactNode
  after?: ReactNode
  noPaddingBottom?: boolean
}

export const Navigation = memo(function Navigation ({ children, after, noPaddingBottom = false }: NavigationProps) {
  const activeTab = useActiveTab()

  return (
    <nav aria-label='Навигация по музыке'>
      {!commonUtils.isTabWithHistory(activeTab) && <VisuallyHidden Component='h1'>{getTabName(activeTab)}</VisuallyHidden>}
      {commonUtils.isTabWithHistory(activeTab) ? <History activeTab={activeTab} after={after} /> : <ApplicationTabs />}
      {children != null && children}
      {children == null && (
        <Div
          style={{
            paddingTop: '8px',
            paddingBottom: noPaddingBottom ? 'unset' : '8px'
          }}
        >
          <SearchInput />
        </Div>
      )}
    </nav>
  )
})

const ApplicationTabs = memo(function ApplicationTabs () {
  return (
    <Flex justify='space-between' noWrap>
      <ContentTabs />
      <ActionTabs />
    </Flex>
  )
})
