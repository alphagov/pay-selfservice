'use strict'

const sinon = require('sinon')
const { expect } = require('chai')

const restrictToLiveStripeAccount = require('./restrict-to-live-stripe-account')

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

    restrictToLiveStripeAccount(req, res, next)

    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(res.status.notCalled).to.be.true // eslint-disable-line
    expect(res.render.notCalled).to.be.true // eslint-disable-line
  })

  it('should render 404 error when the gateway account is not in the request', () => {
    const req = {}

    restrictToLiveStripeAccount(req, res, next)

    expect(next.notCalled).to.be.true // eslint-disable-line
    expect(res.status.calledWith(404))
    expect(res.render.calledWith('404'))
  })

  it('should render 404 error when the gateway account is not Stripe', () => {
    const req = {
      account: {
        type: 'live',
        payment_provider: 'sandbox'
      }
    }

    restrictToLiveStripeAccount(req, res, next)

    expect(next.notCalled).to.be.true // eslint-disable-line
    expect(res.status.calledWith(404))
    expect(res.render.calledWith('404'))
  })

  it('should render 404 error when the gateway account is not live', () => {
    const req = {
      account: {
        type: 'test',
        payment_provider: 'stripe'
      }
    }

    restrictToLiveStripeAccount(req, res, next)

    expect(next.notCalled).to.be.true // eslint-disable-line
    expect(res.status.calledWith(404))
    expect(res.render.calledWith('404'))
  })
})
