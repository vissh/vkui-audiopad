import { Snackbar } from '@vkontakte/vkui'
import { useEffect, useRef, useState, type FC } from 'react'
import { showNotification } from '../../model'
import { TooltipIconButton, type TooltipIconButtonProps } from './TooltipIconButton'

interface AsyncTooltipIconButtonProps extends Omit<TooltipIconButtonProps, 'onClick' | 'busy'> {
  onClick: () => Promise<void>
  errorMessage: string
}

export const AsyncTooltipIconButton: FC<AsyncTooltipIconButtonProps> = ({ onClick, errorMessage, disabled = false, ...props }) => {
  const running = useRef(false)
  const mounted = useRef(true)
  const [pending, setPending] = useState(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])
  const run = async (): Promise<void> => {
    if (running.current || disabled) return
    running.current = true
    setPending(true)
    try {
      await onClick()
    } catch {
      showNotification(<Snackbar onClosed={() => { showNotification(null) }}>{errorMessage}</Snackbar>)
    } finally {
      running.current = false
      if (mounted.current) setPending(false)
    }
  }
  return <TooltipIconButton {...props} disabled={disabled && !pending} busy={pending} onClick={() => { void run() }} />
}
