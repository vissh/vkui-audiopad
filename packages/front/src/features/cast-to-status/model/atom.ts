import { initialState } from '@vk-audiopad/common'
import { storageAtom } from '@/shared/lib/atom'

export const castToStatusAtom = storageAtom({
    key: 'castToStatus',
    initial: initialState.ApplicationControls.castToStatus,
    compareObjects: false
})
