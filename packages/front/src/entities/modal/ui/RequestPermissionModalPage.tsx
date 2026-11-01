import { Icon56LogoVk } from '@vkontakte/icons'
import {
  Button,
  Group,
  Link,
  ModalPage,
  Placeholder,
  type CustomModalProps,
  type OpenModalPageProps
} from '@vkontakte/vkui'

export const RequestPermissionModalPage = ({ modalProps }: CustomModalProps<OpenModalPageProps>) => {
  return (
    <ModalPage
      {...modalProps}
      hideCloseButton={true}
      preventClose={true}
    >
      <Group>
        <Placeholder
          icon={<Icon56LogoVk />}
          action={
            <Link
              onClick={() => {
                chrome.permissions.request({ origins: ['*://*.vk.ru/*'] }, () => {
                  location.reload()
                })
              }}
            >
              <Button size='m'>Открыть окно предоставления доступа</Button>
            </Link>
          }
        >
          Для работы необходимо разрешить запросы к vk.ru
        </Placeholder>
      </Group>
    </ModalPage>
  )
}
