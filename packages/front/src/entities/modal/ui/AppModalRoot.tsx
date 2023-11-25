import { ModalRoot } from '@vkontakte/vkui'
import { type FC } from 'react'
import { useAtom } from '@/shared/lib/atom'
import { activeModalPageAtom } from '../model/atom'
import { EModalPage } from '../model/types'
import { InfoModalPage } from './InfoModalPage'

export const AppModalRoot: FC = () => {
  const [activeModal, setActiveModal] = useAtom(activeModalPageAtom)

  return (
    <ModalRoot
      activeModal={activeModal}
      onOpen={() => (document.body.style.position = 'unset')} // TODO: Genius!
      onClose={() => { setActiveModal(null) }}
    >
      <InfoModalPage
        id={EModalPage.INFO}
        dynamicContentHeight
      />
    </ModalRoot>
  )
}
