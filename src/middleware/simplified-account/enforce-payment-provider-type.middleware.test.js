const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { STRIPE, SANDBOX } = require('@models/constants/payment-providers')
const { NotFoundError } = require('@root/errors')

describe('Middleware: enforcePaymentProviderType', () => {
  let enforcePaymentProviderType, req, res, next

  beforeEach(() => {
    enforcePaymentProviderType = proxyquire('./enforce-payment-provider-type.middleware', {})
    req = {
      account: {
        paymentProvider: STRIPE
      }
    }
    res = {}
    next = sinon.stub()
  })

  it('should call next() when account payment provider is stripe and enforced type is stripe', () => {
    const middleware = enforcePaymentProviderType(STRIPE)
    middleware(req, res, next)

    expect(next.calledOnce).to.be.true // eslint-disable-line
    expect(next.args[0]).to.be.empty // eslint-disable-line
  })

  it('should call next() with error when account payment provider is sandbox and enforced type is stripe', () => {
    req.account.paymentProvider = SANDBOX
    const middleware = enforcePaymentProviderType(STRIPE)
    middleware(req, res, next)
    const expectedError = sinon.match.instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'Attempted to access stripe setting for sandbox service'))
    sinon.assert.calledWith(next, expectedError)
  })
})
