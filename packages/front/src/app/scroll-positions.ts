export interface ScrollPosition {
  y: number
  anchor: string | null
  offset: number
}

const prefix = 'vkap-scroll-v1:'
const limit = 20

export const readScrollPositions = (account: string): Map<string, ScrollPosition> => {
  try {
    const raw = localStorage.getItem(prefix + account)
    if (raw != null && raw.length > 64000) return new Map()
    const entries: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(entries) || entries.length > limit) return new Map()
    return new Map(entries.filter((entry): entry is [string, ScrollPosition] => {
      if (!Array.isArray(entry) || entry.length !== 2 || typeof entry[0] !== 'string' || entry[0].length > 2000) return false
      const position: unknown = entry[1]
      return position != null && typeof position === 'object' &&
        'y' in position && typeof position.y === 'number' && Number.isFinite(position.y) && position.y >= 0 &&
        'anchor' in position && (position.anchor === null || (typeof position.anchor === 'string' && position.anchor.length <= 1000)) &&
        'offset' in position && typeof position.offset === 'number' && Number.isFinite(position.offset)
    }))
  } catch {
    return new Map()
  }
}

export const saveScrollPosition = (account: string, page: string, position: ScrollPosition): void => {
  if (account.length === 0) return
  try {
    const positions = readScrollPositions(account)
    positions.delete(page)
    positions.set(page, position)
    localStorage.setItem(prefix + account, JSON.stringify([...positions].slice(-limit)))
  } catch {
    // Storage denial or quota exhaustion leaves in-window restoration available.
  }
}
