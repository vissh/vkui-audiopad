import { createRoot } from 'react-dom/client'
import { Application } from '@/app/Application'

const container = document.getElementById('root')

if (container != null) {
  const root = createRoot(container)
  root.render(<Application />)
}
