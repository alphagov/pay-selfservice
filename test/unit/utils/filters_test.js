'use strict'

const {expect} = require('chai')
const filters = require('../../../app/utils/filters')

describe('filters', () => {
  describe('state filter', () => {
    it('should be unchanged if it does not contain \'-\'', () => {
      const {result} = filters.getFilters({query: {state: 'started'}})
      expect(result).to.have.property('state').to.equal('started')
      expect(result).not.to.have.property('payment_states')
      expect(result).not.to.have.property('refund_states')
    })
    it('should add state to the relevant filter array if it contains \'-\' and replace the state property with just the state name', () => {
      const {result} = filters.getFilters({query: {state: 'payment-started'}})
      expect(result).to.have.property('state').to.equal('started')
      expect(result).to.have.property('payment_states').to.deep.equal(['started'])
      expect(result).not.to.have.property('refund_states')
    })
  })
})
