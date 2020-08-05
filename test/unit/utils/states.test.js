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
      expect(connectorStatesResult.payment_states.length).to.be.equal(4)
      expect(connectorStatesResult.payment_states).to.be.containingAllOf(['created', 'started', 'submitted'])
      expect(connectorStatesResult.refund_states.length).to.be.equal(0)
    })

    it('should get connector states from Cancelled display state', function () {
      const connectorStatesResult = states.displayStatesToConnectorStates(['Cancelled'])
      expect(connectorStatesResult.payment_states.length).to.be.equal(1)
      expect(connectorStatesResult.payment_states).to.be.containingAllOf(['cancelled'])
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
      expect(connectorStatesResult.payment_states.length).to.be.equal(9)
      expect(connectorStatesResult.payment_states).to.be.containingAllOf(['created', 'started', 'submitted', 'success', 'error', 'declined', 'timedout', 'cancelled'])
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
      expect(states.getDisplayNameForConnectorState({ status: 'capturable' })).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({ status: 'submitted' })).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({ status: 'created' })).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({ status: 'success' })).to.equal('Success')
      expect(states.getDisplayNameForConnectorState({ status: 'success' }, 'refund')).to.equal('Refund success')
      expect(states.getDisplayNameForConnectorState({ status: 'error' }, 'refund')).to.equal('Refund error')
      expect(states.getDisplayNameForConnectorState({ status: 'timedout' })).to.equal('Timed out')
      expect(states.getDisplayNameForConnectorState({ status: 'declined' })).to.equal('Declined')

      expect(states.getDisplayNameForConnectorState({
        status: 'failed',
        code: 'P0030',
        message: 'Foo'
      })).to.equal('Cancelled')
      expect(states.getDisplayNameForConnectorState({
        status: 'failed',
        code: 'P0010',
        message: 'Bar'
      })).to.equal('Declined')
      expect(states.getDisplayNameForConnectorState({
        status: 'cancelled',
        code: 'P0030',
        message: 'Baz'
      })).to.equal('Cancelled')
      expect(states.getDisplayNameForConnectorState({
        status: 'cancelled',
        code: 'P0040',
        message: 'Baz'
      })).to.equal('Cancelled')
      expect(states.getDisplayNameForConnectorState({
        status: 'error',
        code: 'P0050',
        message: 'Kaz'
      })).to.equal('Error')

      expect(states.getDisplayNameForConnectorState({ status: 'submitted' }, 'charge')).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({ status: 'submitted' }, 'PAYMENT')).to.equal('In progress')
      expect(states.getDisplayNameForConnectorState({ status: 'submitted' }, 'refund')).to.equal('Refund submitted')
    })

    it('should get event display name for connector state', function () {
      expect(states.getEventDisplayNameForConnectorState({ status: 'capturable' }, 'payment')).to.equal('Capturable')
      expect(states.getEventDisplayNameForConnectorState({ status: 'submitted' }, 'payment')).to.equal('Submitted')
      expect(states.getEventDisplayNameForConnectorState({ status: 'submitted' }, 'PAYMENT')).to.equal('Submitted')
      expect(states.getEventDisplayNameForConnectorState({ status: 'submitted' }, 'refund')).to.equal('Refund submitted')

      expect(states.getEventDisplayNameForConnectorState({ status: 'started' }, 'payment')).to.equal('Started')
      expect(states.getEventDisplayNameForConnectorState({ status: 'created' }, 'payment')).to.equal('Created')
      expect(states.getEventDisplayNameForConnectorState({ status: 'success' }, 'payment')).to.equal('Success')
      expect(states.getEventDisplayNameForConnectorState({ status: 'success' }, 'refund')).to.equal('Refund success')
      expect(states.getEventDisplayNameForConnectorState({ status: 'error' }, 'refund')).to.equal('Refund error')
      expect(states.getEventDisplayNameForConnectorState({ status: 'timedout' }, 'payment')).to.equal('Timed out')
      expect(states.getEventDisplayNameForConnectorState({ status: 'declined' }, 'payment')).to.equal('Declined')

      expect(states.getEventDisplayNameForConnectorState({
        status: 'failed',
        code: 'P0030',
        message: 'Foo'
      }, 'payment')).to.equal('Cancelled')
      expect(states.getEventDisplayNameForConnectorState({
        status: 'failed',
        code: 'P0010',
        message: 'Bar'
      }, 'payment')).to.equal('Declined')
      expect(states.getEventDisplayNameForConnectorState({
        status: 'cancelled',
        code: 'P0030',
        message: 'Baz'
      }, 'payment')).to.equal('Cancelled')
      expect(states.getEventDisplayNameForConnectorState({
        status: 'cancelled',
        code: 'P0040',
        message: 'Baz'
      }, 'payment')).to.equal('Cancelled')
      expect(states.getEventDisplayNameForConnectorState({
        status: 'error',
        code: 'P0050',
        message: 'Kaz'
      }, 'payment')).to.equal('Error')
    })
  })
})
