import { type FC } from 'react'
import { useAtomValue } from '@/shared/lib/atom'
import { snackbarAtom } from '../model/atom'

export const AppSnackbar: FC = () => {
  return useAtomValue(snackbarAtom)
}
