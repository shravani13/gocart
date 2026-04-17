import addressReducer, { addAddress } from './addressSlice'

describe('addressSlice', () => {
  it('adds address to list', () => {
    const initial = addressReducer(undefined, { type: 'unknown' })
    const payload = {
      id: 'addr_new',
      name: 'Alice',
      city: 'NYC',
      state: 'NY',
      zip: '10001'
    }

    const next = addressReducer(initial, addAddress(payload))
    expect(next.list[next.list.length - 1]).toEqual(payload)
  })
})