import { Component, type ReactNode } from 'react'
import { createErrorReport } from '@/shared/lib/error-report'
import './ApplicationErrorBoundary.css'

export class ApplicationErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean, error?: unknown }> {
  state: { failed: boolean, error?: unknown } = { failed: false }

  static getDerivedStateFromError (error: unknown): { failed: boolean, error: unknown } {
    return { failed: true, error }
  }

  render (): ReactNode {
    if (!this.state.failed) return this.props.children

    // Keep recovery independent of providers that may have caused the failure.
    return (
      <main className='vkap_ui_recovery' role='alert'>
        <h1>Не удалось открыть плеер</h1>
        <p>Перезагрузите интерфейс и попробуйте снова</p>
        <button autoFocus type='button' onClick={() => { location.reload() }}>
          Перезагрузить интерфейс
        </button>
        <details>
          <summary>Информация об ошибке</summary>
          <textarea aria-label='Информация об ошибке' readOnly value={JSON.stringify(createErrorReport(this.state.error), null, 2)} />
        </details>
      </main>
    )
  }
}
