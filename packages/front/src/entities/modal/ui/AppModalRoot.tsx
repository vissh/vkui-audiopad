import { ModalRoot } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { activeModalPageAtom } from '../model/atom'
import { ModalPage } from '../model/types'
import { LikeModalPage } from './LikeModelPage'
import { RequestPermissionModalPage } from './RequestPermissionModalPage'
import { SettingsModalPage } from './SettingsModalPage'
import { SignInModalPage } from './SignInModalPage'

export const AppModalRoot: FC = () => {
  const [activeModal, setActiveModal] = useAtom(activeModalPageAtom)
  const preventClose = [ModalPage.SIGN_IN, ModalPage.REQUEST_PERMISSION]

  return (
    <ModalRoot
      activeModal={activeModal}
      onClose={() => {
        if (activeModal != null && !preventClose.includes(activeModal)) {
          setActiveModal(null)
        }
      }}
    >
      <SettingsModalPage
        id={ModalPage.SETTINGS}
        dynamicContentHeight
      />
      <SignInModalPage
        id={ModalPage.SIGN_IN}
        dynamicContentHeight
      />
      <RequestPermissionModalPage
        id={ModalPage.REQUEST_PERMISSION}
        dynamicContentHeight
      />
      <LikeModalPage
        id={ModalPage.LIKE}
        dynamicContentHeight
      />
    </ModalRoot>
  )
}
