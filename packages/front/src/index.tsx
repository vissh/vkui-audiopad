import { createRoot } from 'react-dom/client'
import { Application } from '@/app/Application'
import { ApplicationErrorBoundary } from '@/app/ApplicationErrorBoundary'
import { registerUsageCounter } from '@/app/usage-counter'
import { flushStorageReads } from '@/shared/lib/atom'

registerUsageCounter()
flushStorageReads()

const container = document.getElementById('root')

if (container !== null) {
  const root = createRoot(container, {
    onCaughtError: () => { console.error('VK Audiopad UI could not be rendered') }
  })
  root.render(<ApplicationErrorBoundary><Application /></ApplicationErrorBoundary>)
}
