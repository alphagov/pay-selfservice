'use strict'

// NPM dependencies
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

// Global setup
chai.use(chaiAsPromised)
const { expect } = chai // must be called after chai.use(chaiAsPromised) to use "should.eventually"

describe('Get Stripe account middleware', () => {
  let req
  let res
  let next

  const stripeAccount = {
    stripeAccountId: 'acct_123example123'
  }

  beforeEach(() => {
    req = {
      correlationId: 'correlation-id',
      account: {
        gateway_account_id: '1'
      }
    }
    res = {
      setHeader: sinon.stub(),
      status: sinon.spy(),
      render: sinon.spy(),
      locals: {}
    }
    next = sinon.spy()
  })

  it('should retrieve Stripe account', done => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock(stripeAccount)

    middleware(req, res, next)

    setTimeout(() => {
      expect(res.locals.stripeAccount).to.deep.equal(stripeAccount)
      expect(next.calledOnce).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when req.account is undefined', done => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock(stripeAccount)
    req.account = undefined

    middleware(req, res, next)

    setTimeout(() => {
      expect(res.locals.stripeAccount).to.be.undefined // eslint-disable-line
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Internal server error' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })

  it('should render an error page when connector rejects the call', done => {
    const middleware = getMiddlewareWithConnectorClientRejectedPromiseMock()

    middleware(req, res, next)

    setTimeout(() => {
      expect(res.locals.stripeAccount).to.be.undefined // eslint-disable-line
      expect(next.notCalled).to.be.true // eslint-disable-line
      expect(res.status.calledWith(500)).to.be.true // eslint-disable-line
      expect(res.render.calledWith('error', { message: 'Please try again or contact support team' })).to.be.true // eslint-disable-line
      done()
    }, 250)
  })
})

function getMiddlewareWithConnectorClientResolvedPromiseMock (getStripeAccountResponse) {
  return proxyquire('./get-stripe-account', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.getStripeAccount = (gatewayAccountId, correlationId) => {
          return new Promise(resolve => {
            resolve(getStripeAccountResponse)
          })
        }
      }
    }
  })
}

function getMiddlewareWithConnectorClientRejectedPromiseMock () {
  return proxyquire('./get-stripe-account', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.getStripeAccount = (gatewayAccountId, correlationId) => {
          return new Promise((resolve, reject) => {
            reject(new Error())
          })
        }
      }
    }
  })
}
