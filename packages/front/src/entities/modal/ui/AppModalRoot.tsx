import { ModalRoot } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { activeModalPageAtom } from '../model/atom'
import { ModalPage } from '../model/types'
import { InfoModalPage } from './InfoModalPage'
import { RequestPermissionModalPage } from './RequestPermissionModalPage'
import { SignInModalPage } from './SignInModalPage'

export const AppModalRoot: FC = () => {
  const [activeModal, setActiveModal] = useAtom(activeModalPageAtom)
  const preventClose = [ModalPage.SIGN_IN, ModalPage.REQUEST_PERMISSION]

  return (
    <ModalRoot
      activeModal={activeModal}
      onOpen={() => (document.body.style.position = 'unset')} // TODO: Genius!
      onClose={() => {
        if (activeModal != null && !preventClose.includes(activeModal)) {
          setActiveModal(null)
        }
      }}
    >
      <InfoModalPage
        id={ModalPage.INFO}
        dynamicContentHeight
      />
      <SignInModalPage
        id={ModalPage.SIGN_IN}
        dynamicContentHeight
      />
      <RequestPermissionModalPage
        id={ModalPage.REQUEST_PERMISSION}
        dynamicContentHeight />
    </ModalRoot>
  )
}
