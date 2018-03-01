'use strict'

const chai = require('chai')
const assertArrays = require('chai-arrays')
let states = require('../../../app/utils/states')
chai.use(assertArrays)
const expect = chai.expect

describe('states', function () {
  describe('new states', function () {

    it('should get unique display states for states dropdown', function () {
      const allDisplayStates = states.allDisplayStates()
      expect(allDisplayStates.length).to.be.equal(9)
      expect(allDisplayStates).to.be.containingAllOf([
        'In progress', 'Success', 'Error', 'Declined', 'Timed out', 'Cancelled',
        'Refund submitted', 'Refund error', 'Refund success'])
    })

    it('should get connector states from In progress display state', function () {
      const connectorStatesResult = states.displayStatesToConnectorStates(['In progress'])
      expect(connectorStatesResult.payment_states.length).to.be.equal(3)
      expect(connectorStatesResult.payment_states).to.be.containingAllOf(['created', 'started', 'submitted'])
      expect(connectorStatesResult.refund_states.length).to.be.equal(0)
    })

    it('should get connector states from Cancelled display state', function () {
      const connectorStatesResult = states.displayStatesToConnectorStates(['Cancelled'])
      expect(connectorStatesResult.payment_states.length).to.be.equal(2)
      expect(connectorStatesResult.payment_states).to.be.containingAllOf(['failed', 'cancelled'])
      expect(connectorStatesResult.refund_states.length).to.be.equal(0)
    })

    it('should get connector states from refunds display states', function () {
      const connectorStatesResult = states.displayStatesToConnectorStates(['Refund success', 'Refund error', 'Refund submitted'])
      expect(connectorStatesResult.refund_states.length).to.be.equal(3)
      expect(connectorStatesResult.refund_states).to.be.containingAllOf(['submitted', 'error', 'success'])
      expect(connectorStatesResult.payment_states.length).to.be.equal(0)
    })

    it('should get connector states from all possible display states', function () {
      const connectorStatesResult = states.displayStatesToConnectorStates(['In progress', 'Success', 'Error', 'Declined', 'Timed out', 'Cancelled', 'Refund success', 'Refund error', 'Refund submitted'])
      expect(connectorStatesResult.payment_states.length).to.be.equal(7)
      expect(connectorStatesResult.payment_states).to.be.containingAllOf(['created', 'started', 'submitted', 'success', 'error', 'failed', 'cancelled'])
      expect(connectorStatesResult.refund_states.length).to.be.equal(3)
      expect(connectorStatesResult.refund_states).to.be.containingAllOf(['submitted', 'error', 'success'])
    })

    it('should convert to correct display state selector objects', function () {
      const allDisplayStates = states.allDisplayStates()
      const allDisplayStateSelectors = states.allDisplayStateSelectorObjects()
      expect(allDisplayStateSelectors.length).to.be.equal(9)
      allDisplayStateSelectors.forEach(selectorObj => {
        expect(allDisplayStates).to.include(selectorObj.value.text)
      })
    })

    it('should get display name for connector state', function () {
      expect(states.getDisplayNameForConnectorState({status: 'submitted'})).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({status: 'created'})).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({status: 'success'})).to.equal('Success')
      expect(states.getDisplayNameForConnectorState({status: 'success'}, 'refund')).to.equal('Refund success')
      expect(states.getDisplayNameForConnectorState({status: 'error'}, 'refund')).to.equal('Refund error')

      expect(states.getDisplayNameForConnectorState({status: 'failed', code: 'P0030', message: 'Foo'})).to.equal('Cancelled')
      expect(states.getDisplayNameForConnectorState({status: 'failed', code: 'P0010', message: 'Bar'})).to.equal('Declined')
      expect(states.getDisplayNameForConnectorState({status: 'cancelled', code: 'P0040', message: 'Baz'})).to.equal('Cancelled')
      expect(states.getDisplayNameForConnectorState({status: 'cancelled', code: 'P0050', message: 'Kaz'})).to.equal('Error')
    })
  })

  describe('old states', function () {
    it('should get all state selector objects', function () {
      const oldStates = states.old_states()
      expect(oldStates.length).to.equal(10)
      const expectedOldStates = ['Created','Started','Submitted','Success','Error','Failed','Cancelled','Refund submitted','Refund success','Refund error']
      oldStates.forEach(state => {
        expect(expectedOldStates).to.include(state.value.text)
      })
    })

    it('should get correct display name for a given connector state', function () {
      expect(states.old_getDisplayName('payment','success')).to.equal('Success')
      expect(states.old_getDisplayName('payment','failed')).to.equal('Failed')
      expect(states.old_getDisplayName('payment','error')).to.equal('Error')
      expect(states.old_getDisplayName('payment','cancelled')).to.equal('Cancelled')
      expect(states.old_getDisplayName('refund','success')).to.equal('Refund success')
      expect(states.old_getDisplayName('refund','submitted')).to.equal('Refund submitted')
      expect(states.old_getDisplayName('refund','error')).to.equal('Refund error')
    })

    it('should get correct description for a given connector state', function () {
      expect(states.old_getDescription('payment','success')).to.equal('Payment successful')
      expect(states.old_getDescription('payment','failed')).to.equal('User failed to complete payment')
      expect(states.old_getDescription('payment','error')).to.equal('Error processing payment')
      expect(states.old_getDescription('payment','cancelled')).to.equal('Service cancelled payment')
      expect(states.old_getDescription('refund','success')).to.equal('Refund successful')
      expect(states.old_getDescription('refund','submitted')).to.equal('Refund submitted')
      expect(states.old_getDescription('refund','error')).to.equal('Error processing refund')
    })
  })
})
