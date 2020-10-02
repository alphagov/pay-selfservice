'use strict'

const sinon = require('sinon')

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
      setHeader: sinon.spy(),
      status: sinon.spy(),
      render: sinon.spy(),
      locals: {}
    }
    next = sinon.spy()
  })

  it('should retrieve Stripe account', async () => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock(stripeAccount)

    await middleware(req, res, next)
    expect(res.locals.stripeAccount).toEqual(stripeAccount)
    sinon.assert.calledOnce(next)
  })

  it('should render an error page when req.account is undefined', async () => {
    const middleware = getMiddlewareWithConnectorClientResolvedPromiseMock(stripeAccount)
    req.account = undefined

    await middleware(req, res, next)
    expect(res.locals.stripeAccount).toBeUndefined() // eslint-disable-line
    sinon.assert.notCalled(next)
    sinon.assert.calledWith(res.status, 500)
    sinon.assert.calledWith(res.render, 'error')
  })

  it(
    'should render an error page when connector rejects the call',
    async () => {
      const middleware = getMiddlewareWithConnectorClientRejectedPromiseMock()

      await middleware(req, res, next)
      expect(res.locals.stripeAccount).toBeUndefined() // eslint-disable-line
      sinon.assert.notCalled(next)
      sinon.assert.calledWith(res.status, 500)
      sinon.assert.calledWith(res.render, 'error')
    }
  )
})

jest.mock('../../services/clients/connector.client', () => ({
  ConnectorClient: function () {
    this.getStripeAccount = () => Promise.resolve(getStripeAccountResponse)
  }
}));

function getMiddlewareWithConnectorClientResolvedPromiseMock (getStripeAccountResponse) {
  return require('./get-stripe-account');
}

function getMiddlewareWithConnectorClientRejectedPromiseMock () {
  return proxyquire('./get-stripe-account', {
    '../../services/clients/connector.client': {
      ConnectorClient: function () {
        this.getStripeAccount = () => Promise.reject(new Error())
      }
    }
  })
}
