import { expect, it } from 'vitest'
import { bestImage, imageUrl, playlistCovers } from './catalog-images'

it('uses the largest playlist photo before grid thumbnails', () => {
  expect(playlistCovers({ photo: { photo_68: 'https://images.invalid/small.jpg', photo_600: 'https://images.invalid/large.jpg' }, thumbs: [{ photo_300: 'https://images.invalid/grid.jpg' }] })).toEqual(['https://images.invalid/large.jpg'])
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
