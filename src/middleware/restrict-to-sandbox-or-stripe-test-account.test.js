const lodash = require('lodash')
const sinon = require('sinon')
const { expect } = require('chai')
const { NotFoundError } = require('../errors')

const restrictToSandboxOrStripeTestAccount = require('./restrict-to-sandbox-or-stripe-test-account')
const PaymentProviders = require('@models/constants/payment-providers')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')

describe('restrict-to-sandbox middleware', () => {
  describe('when a user is using a sandbox account', () => {
    let req, res, next
    before(done => {
      req = {
        account: {
          paymentProvider: PaymentProviders.SANDBOX,
          type: GatewayAccountType.TEST
        }
      }
      res = {}
      next = sinon.spy(done)
      lodash.set(req, 'account.payment_provider', 'sandbox')
      restrictToSandboxOrStripeTestAccount(req, res, next)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when a user is using a Stripe test account', () => {
    let req, res, next
    before(done => {
      req = {
        account: {
          paymentProvider: PaymentProviders.STRIPE,
          type: GatewayAccountType.TEST
        }
      }
      res = {}
      next = sinon.spy(done)
      restrictToSandboxOrStripeTestAccount(req, res, next)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when a user is using a Stripe live account', () => {
    let req, res, next
    before(() => {
      req = {
        account: {
          paymentProvider: PaymentProviders.WORLDPAY,
          type: GatewayAccountType.LIVE
        }
      }
      res = {}
      next = sinon.spy()
    })

    it('should throw error with correct message', () => {
      restrictToSandboxOrStripeTestAccount(req, res, next)
      const expectedError = sinon.match.instanceOf(NotFoundError)
        .and(sinon.match.has('message', 'This page is only available for Sandbox or Stripe test accounts'))
      sinon.assert.calledWith(next, expectedError)
    })
  })

  describe('when a user is not using a sandbox account or a Stripe test account', () => {
    let req, res, next
    before(() => {
      req = {
        account: {
          paymentProvider: PaymentProviders.WORLDPAY,
          type: GatewayAccountType.LIVE
        }
      }
      res = {}
      next = sinon.spy()
    })

    it('should throw error with correct message', () => {
      restrictToSandboxOrStripeTestAccount(req, res, next)
      const expectedError = sinon.match.instanceOf(NotFoundError)
        .and(sinon.match.has('message', 'This page is only available for Sandbox or Stripe test accounts'))
      sinon.assert.calledWith(next, expectedError)
    })
  })
})
