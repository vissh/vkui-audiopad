import { createRoot } from 'react-dom/client'
import { Application } from '@/app/Application'
import { ApplicationErrorBoundary } from '@/app/ApplicationErrorBoundary'

const container = document.getElementById('root')

if (container !== null) {
  const root = createRoot(container, {
    onCaughtError: () => { console.error('VK Audiopad UI could not be rendered') }
  })
  root.render(<ApplicationErrorBoundary><Application /></ApplicationErrorBoundary>)
}
