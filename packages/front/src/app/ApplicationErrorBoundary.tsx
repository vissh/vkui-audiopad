import { Component, type ReactNode } from 'react'
import './ApplicationErrorBoundary.css'

export class ApplicationErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError (): { failed: boolean } {
    return { failed: true }
  }

  render (): ReactNode {
    if (!this.state.failed) return this.props.children

    // Keep recovery independent of providers that may have caused the failure.
    return (
      <main className='vkap_ui_recovery' role='alert'>
        <h1>Не удалось открыть плеер</h1>
        <p>Перезагрузите интерфейс и попробуйте снова.</p>
        <button autoFocus type='button' onClick={() => { location.reload() }}>
          Перезагрузить интерфейс
        </button>
      </main>
    )
  }
}
