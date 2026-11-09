import { imageUrl } from './catalog-images'

const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value != null && !Array.isArray(value)
const text = (value: unknown): string => typeof value === 'string' ? value : ''

export const getCredits = (playlist: Record<string, unknown>, profiles: readonly unknown[] = [], groups: readonly unknown[] = []): { name: string, avatarUrl: string } => {
  const original = object(playlist.original) ? playlist.original : playlist
  const ownerId = original.owner_id
  const group = typeof ownerId === 'number' && ownerId < 0
  const owner = (group ? groups : profiles).filter(object).find(item => item.id === (group ? -ownerId : ownerId))
  const artists = Array.isArray(playlist.main_artists) ? playlist.main_artists.filter(object).map(artist => text(artist.name)).filter(Boolean).join(', ') : ''
  return {
    name: artists || (owner == null ? '' : text(owner.name) || [text(owner.first_name), text(owner.last_name)].filter(Boolean).join(' ')) || text(playlist.subtitle),
    avatarUrl: owner == null ? '' : imageUrl(owner.photo_50) || imageUrl(owner.photo_100)
  }
}
