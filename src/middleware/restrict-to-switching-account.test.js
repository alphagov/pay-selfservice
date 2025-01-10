'use strict'

const sinon = require('sinon')
const { expect } = require('chai')
const { NotFoundError } = require('../errors')

const gatewayAccountFixtures = require('../../test/fixtures/gateway-account.fixtures')
const restrictToSwitchingAccount = require('./restrict-to-switching-account')

describe('restrict-to-switching-account middleware', () => {
  describe('when page is routing an account with provider switch enabled', () => {
    let req, res, next
    before(done => {
      req = { account: gatewayAccountFixtures.validGatewayAccount({ provider_switch_enabled: true }) }
      res = {}
      next = sinon.spy(done)
      restrictToSwitchingAccount(req, res, next)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when page is routing an account with provider switch disabled', () => {
    let req, res, next
    before(() => {
      req = { account: gatewayAccountFixtures.validGatewayAccount({ provider_switch_enabled: false }) }
      res = {}
      next = sinon.spy()
    })

    it('should throw error with correct message', () => {
      const expectedError = sinon.match.instanceOf(NotFoundError)
        .and(sinon.match.has('message', 'This page is only available for accounts flagged for switching provider'))
      restrictToSwitchingAccount(req, res, next)
      sinon.assert.calledWith(next, expectedError)
    })
  })
})
