import cartReducer, {
    addToCart,
    removeFromCart,
    deleteItemFromCart,
    clearCart
  } from './cartSlice'
  
  describe('cartSlice', () => {
    const initialState = { total: 0, cartItems: {} }
  
    it('returns initial state', () => {
      expect(cartReducer(undefined, { type: 'unknown' })).toEqual(initialState)
    })
  
    it('adds a new item to cart', () => {
      const state = cartReducer(initialState, addToCart({ productId: 'p1' }))
      expect(state.cartItems).toEqual({ p1: 1 })
      expect(state.total).toBe(1)
    })
  
    it('increments existing item quantity', () => {
      const pre = { total: 1, cartItems: { p1: 1 } }
      const state = cartReducer(pre, addToCart({ productId: 'p1' }))
      expect(state.cartItems.p1).toBe(2)
      expect(state.total).toBe(2)
    })
  
    it('decrements quantity and removes key at zero', () => {
      const pre = { total: 1, cartItems: { p1: 1 } }
      const state = cartReducer(pre, removeFromCart({ productId: 'p1' }))
      expect(state.cartItems.p1).toBeUndefined()
      expect(state.total).toBe(0)
    })
  
    it('deletes an item and subtracts total by item quantity', () => {
      const pre = { total: 4, cartItems: { p1: 3, p2: 1 } }
      const state = cartReducer(pre, deleteItemFromCart({ productId: 'p1' }))
      expect(state.cartItems).toEqual({ p2: 1 })
      expect(state.total).toBe(1)
    })
  
    it('clears cart', () => {
      const pre = { total: 4, cartItems: { p1: 3, p2: 1 } }
      const state = cartReducer(pre, clearCart())
      expect(state).toEqual(initialState)
    })
  })