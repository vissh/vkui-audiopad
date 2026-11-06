const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value != null && !Array.isArray(value)

export const imageUrl = (value: unknown): string => {
  if (typeof value !== 'string') return ''
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.href : ''
  } catch { return '' }
}

export const bestImage = (value: unknown): string => {
  if (typeof value === 'string') return imageUrl(value)
  if (Array.isArray(value)) {
    const images = value.filter(object).sort((left, right) => Number(right.width ?? 0) - Number(left.width ?? 0))
    return images.map(item => bestImage(item)).find(Boolean) ?? ''
  }
  if (!object(value)) return ''
  for (const key of ['photo_600', 'photo_300', 'photo_270', 'photo_135', 'photo_68', 'url', 'src']) {
    const url = imageUrl(value[key])
    if (url.length > 0) return url
  }
  return bestImage(value.sizes)
}

export const playlistCovers = (value: unknown): string[] => {
  if (!object(value)) return []
  const cover = bestImage(value.photo)
  if (cover.length > 0) return [cover]
  const thumbs = Array.isArray(value.thumbs) ? value.thumbs : []
  return thumbs.map(bestImage).filter(Boolean).slice(0, 4)
}
