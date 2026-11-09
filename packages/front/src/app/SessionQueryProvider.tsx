import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState, type FC, type ReactNode } from 'react'
import { useSessionUserId, useSessionReady } from '@/entities/session'
import { StartupSkeleton } from './StartupSkeleton'

const AccountQueries: FC<{ children: ReactNode }> = ({ children }) => {
  const [client] = useState(() => new QueryClient())
  useEffect(() => () => {
    void client.cancelQueries().catch(() => { console.warn('Query cancellation failed') })
    client.clear()
  }, [client])
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export const SessionQueryProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const userId = useSessionUserId()
  const ready = useSessionReady()
  if (!ready) return <StartupSkeleton />
  return <AccountQueries key={userId}>{children}</AccountQueries>
}
