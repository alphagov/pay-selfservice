const { expect } = require('chai')
const flattenNestedValues = require('./flatten-nested-values')
describe('flatten nested values utility', () => {
  it('correctly flattens nested values', () => {
    const nested = {
      one: {
        two: {
          index: 'path-1',
          secondPage: 'path-2'
        },
        three: 'path-3'
      },
      four: 'path-4'
    }
    const flat = flattenNestedValues(nested)
    expect(flat.length).to.equal(4)
    expect(flat).to.have.members(['path-1', 'path-2', 'path-3', 'path-4'])
  })
})
