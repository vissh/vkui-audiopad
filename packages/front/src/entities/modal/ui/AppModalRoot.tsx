import {
  useModalManager,
  type CustomModalProps,
  type OpenModalPageProps
} from '@vkontakte/vkui'
import { useEffect, type ComponentType, type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { activeModalPageAtom } from '../model/atom'
import { ModalPage } from '../model/types'
import { LikeModalPage } from './LikeModelPage'
import { RequestPermissionModalPage } from './RequestPermissionModalPage'
import { SettingsModalPage } from './SettingsModalPage'
import { SignInModalPage } from './SignInModalPage'

interface ModalConfig {
  component: ComponentType<CustomModalProps<OpenModalPageProps>>
}

const MODALS: Partial<Record<ModalPage, ModalConfig>> = {
  [ModalPage.SETTINGS]: { component: SettingsModalPage },
  [ModalPage.SIGN_IN]: { component: SignInModalPage },
  [ModalPage.REQUEST_PERMISSION]: { component: RequestPermissionModalPage },
  [ModalPage.LIKE]: { component: LikeModalPage }
}

export const AppModalRoot: FC = () => {
  const [modalApi, modalHolder] = useModalManager({ saveHistory: false })
  const [activeModal, setActiveModal] = useAtom(activeModalPageAtom)

  useEffect(() => {
    if (activeModal == null) {
      return
    }

    const modal = MODALS[activeModal]
    if (modal != null) {
      modalApi.openCustomModalPage({
        id: activeModal,
        component: modal.component,
        baseProps: { dynamicContentHeight: true }
      })
    }

    setActiveModal(null)
  }, [activeModal, modalApi, setActiveModal])

  return modalHolder
}
