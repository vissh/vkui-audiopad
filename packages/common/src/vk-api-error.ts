export type VKApiFailureKind = 'unauthorized' | 'rate-limit' | 'http' | 'network' | 'format' | 'timeout' | 'unavailable' | 'vk' | 'session-changed'

export class VKApiError extends Error {
  readonly kind: VKApiFailureKind
  readonly status?: number
  readonly code?: number

  constructor (kind: VKApiFailureKind, details: { status?: number, code?: number } = {}) {
    super(`VK request failed (${kind})`)
    this.name = 'VKApiError'
    this.kind = kind
    this.status = details.status
    this.code = details.code
  }
}
