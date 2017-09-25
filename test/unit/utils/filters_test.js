'use strict'

const {expect} = require('chai')
const filters = require('../../../app/utils/filters')

describe('filters', () => {
  describe('state filter', () => {
    it('should be unchanged if there is a single state does not contain \'-\' but should add it to the \'payment_states\' array for backward compatibility', () => {
      const {result} = filters.getFilters({query: {state: 'started'}})
      expect(result).to.have.property('state').to.equal('started')
      expect(result).to.have.property('payment_states').to.deep.equal(['started'])
      expect(result).not.to.have.property('refund_states')
    })
    it('should add state to the relevant filter array there is a single state that contains \'-\' and replace the state property with just the state name', () => {
      const {result} = filters.getFilters({query: {state: 'payment-started'}})
      expect(result).to.have.property('state').to.equal('started')
      expect(result).to.have.property('payment_states').to.deep.equal(['started'])
      expect(result).not.to.have.property('refund_states')
    })
    it('should states to their respective relevant filter array (defaulting to \'payment_states\') if there are multiple states and should set the state filter to the first item in the combined \'payment_states\' and \'refund_states\' arrays for backward compatibility', () => {
      const {result} = filters.getFilters({query: {state: ['payment-started', 'payment-success', 'refund-created', 'complete']}})
      expect(result).to.have.property('payment_states').to.deep.equal(['started', 'success', 'complete'])
      expect(result).to.have.property('refund_states').to.deep.equal(['created'])
      expect(result).to.have.property('state').to.equal('started')
    })
  })
})
