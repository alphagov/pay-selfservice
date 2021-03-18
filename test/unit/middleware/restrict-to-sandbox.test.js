'use strict'

const lodash = require('lodash')
const sinon = require('sinon')
const { expect } = require('chai')
const { NotFoundError } = require('../../../app/errors')

const restrictToSandboxOrStripeTestAccount = require('../../../app/middleware/restrict-to-sandbox-or-stripe-test-account')

describe('restrict-to-sandbox middleware', () => {
  describe('when a user is using a sandbox account', () => {
    let req, res, next
    before(done => {
      req = {}
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
      req = {}
      res = {}
      next = sinon.spy(done)
      lodash.set(req, 'account.payment_provider', 'stripe')
      lodash.set(req, 'account.type', 'test')
      restrictToSandboxOrStripeTestAccount(req, res, next)
    })

    it('should call next', () => {
      expect(next.called).to.equal(true)
      expect(next.lastCall.args.length).to.equal(0)
    })
  })

  describe('when a user is not using a sandbox account or a Stripe test account', () => {
    let req, res, next
    before(() => {
      req = {}
      res = {}
      next = sinon.spy()
    })

    it('should throw error with correct message', () => {
      lodash.set(req, 'account.payment_provider', 'worldpay')
      restrictToSandboxOrStripeTestAccount(req, res, next)
      const expectedError = sinon.match.instanceOf(NotFoundError)
        .and(sinon.match.has('message', 'This page is only available for Sandbox or Stripe test accounts'))
      sinon.assert.calledWith(next, expectedError)
    })
  })
})
