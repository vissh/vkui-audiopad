import { type FC } from 'react'
import { setRequestPermissionModal, setSignInModal } from '@/entities/modal'
import { useUpdateWebToken } from '../model/hooks'

export const SignIn: FC = () => {
  const { data: webToken } = useUpdateWebToken()

  if (webToken?.error != null) {
    setSignInModal()
  }

  chrome.permissions.contains({ origins: ['*://*.vk.com/*'] }, (result) => {
    if (!result) {
      setRequestPermissionModal()
    }
  })

  return null
}
