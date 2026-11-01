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

export const SignInModalPage = ({ modalProps }: CustomModalProps<OpenModalPageProps>) => {
  return (
    <ModalPage
      {...modalProps}
      hideCloseButton={true}
      preventClose={true}
    >
      <Group>
        <Placeholder
          icon={<Icon56LogoVk />}
          title='Вход ВКонтакте'
          action={
            <Link
              href='https://vk.ru/'
              target='_blank'
            >
              <Button size='m'>Перейти на сайт</Button>
            </Link>
          }
        >
          Авторизуйтесь на сайте vk.ru для использования расширения
        </Placeholder>
      </Group>
    </ModalPage>
  )
}
