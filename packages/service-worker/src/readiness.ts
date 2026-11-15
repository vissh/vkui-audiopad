export interface Readiness {
  run: (action: () => void | Promise<void>) => void
  execute: <T>(action: () => Promise<T>, prepare?: () => Promise<void>) => Promise<T>
  acceptsMedia: () => boolean
}

const createExecutor = (ready: Promise<boolean>): Pick<Readiness, 'execute' | 'run'> => {
  const pending: Array<{ prepare?: () => Promise<void>, start: () => void, reject: (error: unknown) => void }> = []
  let draining = false
  const drain = async (): Promise<void> => {
    if (draining) return
    draining = true
    const success = await ready
    let entry: typeof pending[number] | undefined
    while ((entry = pending.shift()) != null) {
      try {
        if (!success) throw new Error('Background initialization failed')
        if (entry.prepare != null) await entry.prepare()
        // Start ready actions in one turn so later intent can cancel earlier work.
        entry.start()
      } catch (error) { entry.reject(error) }
    }
    draining = false
  }
  const execute: Readiness['execute'] = async <T>(action: () => Promise<T>, prepare?: () => Promise<void>): Promise<T> => await new Promise<T>((resolve, reject) => {
    pending.push({ prepare, start: () => { resolve(action()) }, reject })
    void drain().catch(() => { console.warn('Command scheduling failed') })
  })
  return {
    execute,
    run: action => { void execute(async () => { await action() }).catch(() => { console.warn('Background action failed') }) }
  }
}

export const immediateReadiness: Readiness = {
  ...createExecutor(Promise.resolve(true)),
  acceptsMedia: () => true
}

export const createReadiness = (initialize: (acceptMedia: () => void) => Promise<void>) => {
  let status: 'loading' | 'ready' | 'failed' = 'loading'
  let acceptMedia = false
  let complete: (success: boolean) => void = () => {}
  const ready = new Promise<boolean>(resolve => { complete = resolve })
  const executor = createExecutor(ready)
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
    ...executor
  }
}
