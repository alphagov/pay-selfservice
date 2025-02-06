const sinon = require('sinon')
const { expect } = require('chai')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const mockStripeDetailsService = {
  getConnectorStripeAccountSetup: sinon.stub().resolves({
    foo: 'bar'
  })
}

const {
  next,
  call
} = new ControllerTestBuilder('@middleware/simplified-account/settings/stripe-account-setup-strategy.middleware')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@services/stripe-details.service': mockStripeDetailsService
  })
  .build()

describe('Middleware: stripeAccountSetupStrategy', () => {
  describe('when stripe account setup progress resolution succeeds', () => {
    it('should set request key and call next', async () => {
      const { req } = await call()
      sinon.assert.calledOnce(next)
      expect(req).to.have.property('gatewayAccountStripeProgress')
      expect(req.gatewayAccountStripeProgress).to.deep.equal({
        foo: 'bar'
      })
    })
  })

  describe('when stripe account setup progress resolution fails', () => {
    before(() => {
      const error = new RESTClientError('whoops')
      mockStripeDetailsService.getConnectorStripeAccountSetup.rejects(error)
    })

    it('should call next with error', async () => {
      await call()
      const expectedError = sinon.match.instanceOf(RESTClientError)
        .and(sinon.match.has('message', 'whoops'))
      sinon.assert.calledOnce(next)
      sinon.assert.calledWith(next, expectedError)
    })
  })
})
