import { expect, it } from 'vitest'
import { getCredits } from './playlist-credits'

it('attributes a followed library copy to its original author', () => {
  const profiles = [{ id: 1, first_name: 'Library', last_name: 'Owner' }, { id: 2, first_name: 'Original', last_name: 'Author', photo_50: 'https://images.invalid/author.jpg' }]
  expect(getCredits({ owner_id: 1, original: { owner_id: 2 } }, profiles)).toEqual({ name: 'Original Author', avatarUrl: 'https://images.invalid/author.jpg' })
})

it('resolves community photos and preserves release artist credits', () => {
  const groups = [{ id: 3, name: 'Curator', photo_50: 'https://images.invalid/group.jpg' }]
  expect(getCredits({ owner_id: 1, original: { owner_id: -3 } }, [], groups)).toEqual({ name: 'Curator', avatarUrl: 'https://images.invalid/group.jpg' })
  expect(getCredits({ owner_id: -3, main_artists: [{ name: 'Artist' }] }, [], groups).name).toBe('Artist')
})

it('uses the supplied subtitle when original author metadata is unavailable', () => {
  expect(getCredits({ owner_id: 1, original: { owner_id: 2 }, subtitle: 'Guest author' }, [{ id: 1, first_name: 'Library owner' }])).toEqual({ name: 'Guest author', avatarUrl: '' })
})
