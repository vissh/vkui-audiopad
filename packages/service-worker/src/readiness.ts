export interface Readiness {
  run: (action: () => void | Promise<void>) => void
  acceptsMedia: () => boolean
}

export const immediateReadiness: Readiness = {
  run: action => { void Promise.resolve().then(action).catch(() => { console.warn('Background action failed') }) },
  acceptsMedia: () => true
}

export const createReadiness = (initialize: (acceptMedia: () => void) => Promise<void>) => {
  let status: 'loading' | 'ready' | 'failed' = 'loading'
  let acceptMedia = false
  let complete: (success: boolean) => void = () => {}
  const ready = new Promise<boolean>(resolve => { complete = resolve })
  let starting: Promise<boolean> | undefined
  const start = (): Promise<boolean> => {
    starting ??= (async () => {
      try {
        await initialize(() => { acceptMedia = true })
        status = 'ready'
        complete(true)
        return true
      } catch {
        status = 'failed'
        complete(false)
        console.warn('Playback initialization failed')
        return false
      }
    })()
    return starting
  }
  return {
    start,
    getStatus: () => status,
    acceptsMedia: () => status !== 'failed' && acceptMedia,
    run: (action: () => void | Promise<void>): void => {
      void ready.then(async success => {
        if (success) await action()
      }).catch(() => { console.warn('Background action failed') })
    }
  }
}
