import ratingReducer, { addRating } from './ratingSlice'

describe('ratingSlice', () => {
  it('adds rating', () => {
    const initial = ratingReducer(undefined, { type: 'unknown' })
    const rating = { id: 'r1', rating: 5, review: 'Great' }
    const next = ratingReducer(initial, addRating(rating))
    expect(next.ratings).toContainEqual(rating)
  })
})