import productReducer, { setProduct, clearProduct } from './productSlice'

describe('productSlice', () => {
  it('sets products', () => {
    const initial = productReducer(undefined, { type: 'unknown' })
    const products = [{ id: 'p1', name: 'Test Product' }]
    const next = productReducer(initial, setProduct(products))
    expect(next.list).toEqual(products)
  })

  it('clears products', () => {
    const initial = productReducer(undefined, { type: 'unknown' })
    const next = productReducer(initial, clearProduct())
    expect(next.list).toEqual([])
  })
})