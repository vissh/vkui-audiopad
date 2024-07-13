import { TonConnectButton, useTonAddress, useTonConnectUI, useTonWallet } from '@tonconnect/ui-react'
import { Group, Header } from '@vkontakte/vkui'
import { type FC } from 'react'
import { Navigation } from '@/widgets/navigation'
import { Content } from '@/shared/ui/content'

interface TonNftListProps {
  userId: string
  active: boolean
}

export const TonNftList: FC<TonNftListProps> = ({ active }) => {
  const userFriendlyAddress = useTonAddress()
  const rawAddress = useTonAddress(false)
  const wallet = useTonWallet()
  const [tonConnectUI, setOptions] = useTonConnectUI()

  return (
    <Content
      display={active}
      error={null}>
      <Group>
        <Navigation>
          <Group
            mode='plain'
            header={<Header aside={<TonConnectButton />} />}>
            <div>
              <span><b>User-friendly address:</b> {userFriendlyAddress}</span>
              <br></br>
              <span><b>Raw address:</b> {rawAddress}</span>
              <br></br>
              {wallet != null && (
                <div>
                  {/* <span>Connected wallet: {wallet.name}</span> */}
                  <span>Device: {wallet.device.appName}</span>
                </div>
              )}
            </div>
          </Group>
        </Navigation>
      </Group>
    </Content>
  )
}
