'use strict'

const sinon = require('sinon')
const { expect } = require('chai')

const restrictToStripeAccountContext = require('./restrict-to-stripe-account-context')
const { NotFoundError } = require('../../errors')

describe('Restrict to live stripe account middleware', () => {
  let res
  let next

  beforeEach(() => {
    res = {
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy()
    }
    next = sinon.spy()
  })

  it('should call next when the gateway account is live and it is Stripe', () => {
    const req = {
      account: {
        type: 'live',
        payment_provider: 'stripe'
      }
    }

    restrictToStripeAccountContext(req, res, next)

    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(res.status.notCalled).to.be.true // eslint-disable-line
    expect(res.render.notCalled).to.be.true // eslint-disable-line
  })

  it('should throw NotFoundError when the gateway account is not in the request', () => {
    const req = {}

    restrictToStripeAccountContext(req, res, next)

    const expectedError = sinon.match.instanceOf(NotFoundError)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should throw NotFoundError when the gateway account is not Stripe', () => {
    const req = {
      account: {
        type: 'live',
        payment_provider: 'sandbox'
      }
    }

    restrictToStripeAccountContext(req, res, next)

    const expectedError = sinon.match.instanceOf(NotFoundError)
    sinon.assert.calledWith(next, expectedError)
  })

  it('should throw NotFoundError when the gateway account is not live', () => {
    const req = {
      account: {
        type: 'test',
        payment_provider: 'stripe'
      }
    }

    restrictToStripeAccountContext(req, res, next)

    const expectedError = sinon.match.instanceOf(NotFoundError)
    sinon.assert.calledWith(next, expectedError)
  })
})
