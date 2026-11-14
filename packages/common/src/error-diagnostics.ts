import { readVKApiError } from './vk-api-error'

export const describeError = (error: unknown) => {
  const known = readVKApiError(error)
  const candidate = typeof error === 'object' && error != null ? error : {}
  const name = 'name' in candidate && typeof candidate.name === 'string' && ['TypeError', 'RangeError', 'SyntaxError', 'AbortError', 'TimeoutError'].includes(candidate.name) ? candidate.name : 'Error'
  // Keep only extension asset locations, never arbitrary messages, causes or URLs.
  const stack = 'stack' in candidate && typeof candidate.stack === 'string'
    ? [...candidate.stack.matchAll(/(?:chrome-extension|moz-extension):\/\/[\w-]+\/(assets\/[\w-]+\.js|(?:service-worker|offscreen)\.js):([0-9]+):([0-9]+)/g)].slice(0, 8).map(match => `${match[1]}:${match[2]}:${match[3]}`).join('\n')
    : ''
  if (known == null) return { name, message: 'Unexpected application error', ...(stack.length > 0 ? { stack } : {}) }
  const { kind, status, code, operation, stage, attempt, contentType, redirected } = known
  return { name: known.name, message: known.message, kind, status, code, operation, stage, attempt, contentType, redirected, ...(stack.length > 0 ? { stack } : {}) }
}
