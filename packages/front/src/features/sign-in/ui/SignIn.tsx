import { Banner, Button, Group } from '@vkontakte/vkui'
import { useEffect, type FC } from 'react'
import { setRequestPermissionModal, setSignInModal } from '@/entities/modal'
import { useUpdateWebToken } from '../model/hooks'

export const SignIn: FC = () => {
  const { data: webToken, isError, isFetching, refetch } = useUpdateWebToken()

  useEffect(() => {
    if (webToken?.error?.type === 'unauthorized') setSignInModal()
  }, [webToken])

  useEffect(() => {
    let active = true
    chrome.permissions.contains({ origins: ['*://*.vk.ru/*'] }, allowed => {
      if (active && !allowed) setRequestPermissionModal()
    })
    return () => { active = false }
  }, [])

  if (!isError && webToken?.error?.type !== 'exception') return null

  return (
    <Group mode='plain'>
      <Banner
        role='status'
        title='Не удалось проверить подключение к VK'
        subtitle='Проверьте соединение и повторите попытку.'
        actions={
          <Button
            mode='secondary'
            loading={isFetching}
            loadingLabel='Проверяем подключение'
            disabled={isFetching}
            onClick={() => { void refetch() }}
          >
            Повторить
          </Button>
        }
      />
    </Group>
  )
}
