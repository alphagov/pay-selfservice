const { expect } = require('chai')
const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const { NotFoundError } = require('@root/errors')
const GatewayAccount = require('@models/gateway-account/GatewayAccount.class')
const gatewayAccountFixtures = require('@test/fixtures/gateway-account.fixtures')

describe('Middleware: enforcePaymentProviderType', () => {
  let enforcePaymentProviderType, req, res, next

  beforeEach(() => {
    enforcePaymentProviderType = proxyquire('./enforce-payment-provider-type.middleware', {})
    req = {
      account: new GatewayAccount(gatewayAccountFixtures.validGatewayAccount({
        payment_provider: STRIPE,
        provider_switch_enabled: true
      })),
    }
    res = {}
    next = sinon.stub()
  })

  it('should call next() when account payment provider is stripe and enforced type is stripe', () => {
    const middleware = enforcePaymentProviderType(STRIPE)
    middleware(req, res, next)

    expect(next.calledOnce).to.be.true
    expect(next.args[0]).to.be.empty
  })

  it('should call next() with error when account payment provider is stripe and enforced type is worldpay', () => {
    const middleware = enforcePaymentProviderType(WORLDPAY)
    middleware(req, res, next)
    const expectedError = sinon.match.instanceOf(NotFoundError)
      .and(sinon.match.has('message', 'Attempted to access worldpay setting for stripe service'))
    sinon.assert.calledWith(next, expectedError)
  })
})
