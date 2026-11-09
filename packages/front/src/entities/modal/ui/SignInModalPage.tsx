import { Icon56LogoVk } from '@vkontakte/icons'
import {
  Button,
  Group,
  ModalPage,
  Placeholder,
  type CustomModalProps,
  type OpenModalPageProps
} from '@vkontakte/vkui'

export const SignInModalPage = ({ modalProps }: CustomModalProps<OpenModalPageProps>) => {
  return (
    <ModalPage
      {...modalProps}
      aria-label='Вход ВКонтакте'
      hideCloseButton={true}
      preventClose={true}
    >
      <Group>
        <Placeholder
          icon={<Icon56LogoVk />}
          title='Вход ВКонтакте'
          action={
            <Button
              size='m'
              href='https://vk.ru/'
              target='_blank'
            >
              Перейти на сайт
            </Button>
          }
        >
          Авторизуйтесь на сайте vk.ru для использования расширения
        </Placeholder>
      </Group>
    </ModalPage>
  )
}
