import { Icon56LogoVk } from '@vkontakte/icons'
import {
  Button,
  Group,
  ModalPage,
  Placeholder,
  type CustomModalProps,
  type OpenModalPageProps
} from '@vkontakte/vkui'

export const RequestPermissionModalPage = ({ modalProps }: CustomModalProps<OpenModalPageProps>) => {
  return (
    <ModalPage
      {...modalProps}
      aria-label='Разрешение доступа к VK'
      hideCloseButton={true}
      preventClose={true}
    >
      <Group>
        <Placeholder
          icon={<Icon56LogoVk />}
          action={
            <Button
              size='m'
              onClick={() => {
                chrome.permissions.request({ origins: ['*://*.vk.ru/*'] }, () => {
                  location.reload()
                })
              }}
            >
              Открыть окно предоставления доступа
            </Button>
          }
        >
          Для работы необходимо разрешить запросы к vk.ru
        </Placeholder>
      </Group>
    </ModalPage>
  )
}
