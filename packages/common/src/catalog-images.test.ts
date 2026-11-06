import { expect, it } from 'vitest'
import { bestImage, imageUrl, playlistCovers } from './catalog-images'

it.each([1, 2, 3, 4])('keeps all %d server collage tiles when photo repeats its first tile', count => {
  const thumbs = Array.from({ length: count }, (_, index) => ({ photo_600: `https://images.invalid/${index}.jpg` }))
  expect(playlistCovers({ photo: thumbs[0], thumbs })).toEqual(thumbs.map(thumb => thumb.photo_600))
})

it('uses the largest standalone cover when usable collage tiles are absent', () => {
  const photo = { photo_68: 'https://images.invalid/small.jpg', photo_600: 'https://images.invalid/large.jpg' }
  expect(playlistCovers({ photo })).toEqual(['https://images.invalid/large.jpg'])
  expect(playlistCovers({ photo, thumbs: [null, { photo_300: 'javascript:invalid' }] })).toEqual(['https://images.invalid/large.jpg'])
})

it('keeps at most four individual covers in server order without mutating their sizes', () => {
  const sizes = Object.freeze([{ width: 68, url: 'https://images.invalid/small.jpg' }, { width: 300, url: 'https://images.invalid/large.jpg' }])
  expect(bestImage(sizes)).toBe('https://images.invalid/large.jpg')
  expect(sizes[0].width).toBe(68)
  expect(playlistCovers({ thumbs: Array.from({ length: 5 }, (_, index) => ({ photo_300: `https://images.invalid/${index}.jpg` })) })).toEqual(Array.from({ length: 4 }, (_, index) => `https://images.invalid/${index}.jpg`))
})

it.each(['javascript:alert(1)', 'data:text/html,private', 'http://images.invalid/cover.jpg', '', null, {}])('rejects unsafe or missing image URLs: %j', value => {
  expect(imageUrl(value)).toBe('')
})

it('tolerates missing and malformed cover metadata', () => {
  expect(playlistCovers({ photo: null, thumbs: [{ sizes: [{ width: 100, url: 'https://images.invalid/fallback.jpg' }] }, { photo_300: 3 }] })).toEqual(['https://images.invalid/fallback.jpg'])
  expect(playlistCovers(null)).toEqual([])
})
