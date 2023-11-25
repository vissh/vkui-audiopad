import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { commonTypes } from '@vk-audiopad/common'
import {
  AdaptivityProvider,
  AppRoot,
  ConfigProvider,
  Panel,
  Platform,
  SplitCol,
  SplitLayout,
  View
} from '@vkontakte/vkui'
import '@vkontakte/vkui/dist/vkui.css'
import { type FC } from 'react'
import { Player } from '@/widgets/player'
import { SignIn } from '@/features/sign-in'
import { AppModalRoot, themeAtom } from '@/entities/modal'
import { Notification } from '@/entities/notification'
import { useAtomValue } from '@/shared/lib/atom'
import { Pages } from './Pages'
import './base.css'

declare global {
  interface Window {
    _tmr: undefined | unknown[]
  }
}

export const Application: FC = () => {
  const queryClient = new QueryClient()
  const theme = useAtomValue(themeAtom)

  return (
    <ConfigProvider
      platform={Platform.ANDROID}
      hasCustomPanelHeaderAfter={false}
      appearance={theme === commonTypes.Theme.SYSTEM ? undefined : theme}
    >
      <AdaptivityProvider>
        <QueryClientProvider client={queryClient}>
          <AppRoot>
            <SplitLayout
              style={{ justifyContent: 'center' }}
              modal={<AppModalRoot />}
            >
              <SplitCol
                maxWidth={1216}
                minWidth={780}
              >
                <View activePanel='vkaudiopad'>
                  <Panel id='vkaudiopad'>
                    <SignIn>
                      <Player />
                      <Pages />
                    </SignIn>
                    <Notification />
                  </Panel>
                </View>
              </SplitCol>
            </SplitLayout>
          </AppRoot>
        </QueryClientProvider>
      </AdaptivityProvider>
    </ConfigProvider>
  )
}
