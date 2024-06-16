import { Icon56LogoVk } from '@vkontakte/icons'
import {
  Button,
  Group,
  Link,
  ModalPage,
  Placeholder
} from '@vkontakte/vkui'

export const RequestPermissionModalPage = ({ ...props }) => {
  return (
    <ModalPage
      {...props}
      hideCloseButton={true}
    >
      <Group>
        <Placeholder
          icon={<Icon56LogoVk />}
          action={
            <Link
              onClick={() => {
                chrome.permissions.request({ origins: ['*://*.vk.com/*'] }, () => {
                  location.reload()
                })
              }}
            >
              <Button size='m'>Открыть окно предоставления доступа</Button>
            </Link>
          }
        >
          Для работы необходимо разрешить запросы к vk.com
        </Placeholder>
      </Group>
    </ModalPage>
  )
}
