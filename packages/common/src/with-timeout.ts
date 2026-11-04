export const withTimeout = async <T>(operation: (signal: AbortSignal) => Promise<T>, timeoutMs: number, signal?: AbortSignal): Promise<T> => {
  signal?.throwIfAborted()
  const controller = new AbortController()
  const forwardAbort = (): void => { controller.abort(signal?.reason) }
  let detach = (): void => {}
  const aborted = new Promise<never>((_resolve, reject) => {
    const onAbort = (): void => { reject(controller.signal.reason) }
    controller.signal.addEventListener('abort', onAbort, { once: true })
    detach = () => { controller.signal.removeEventListener('abort', onAbort) }
  })
  const timeout = setTimeout(() => { controller.abort(new DOMException('Operation timed out', 'TimeoutError')) }, timeoutMs)
  signal?.addEventListener('abort', forwardAbort, { once: true })
  try {
    const value = await Promise.race([operation(controller.signal), aborted])
    controller.signal.throwIfAborted()
    return value
  } finally {
    clearTimeout(timeout)
    signal?.removeEventListener('abort', forwardAbort)
    detach()
  }
}
