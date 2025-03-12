const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { expect } = require('chai')
const sinon = require('sinon')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const GATEWAY_ACCOUNT_ID = '123'

const mockResponse = sinon.spy()
const mockUpdateCollectBillingAddress = sinon.spy()

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/card-payments/collect-billing-address.controller')
  .withAccount({
    type: ACCOUNT_TYPE,
    id: GATEWAY_ACCOUNT_ID
  })
  .withService({
    externalId: SERVICE_EXTERNAL_ID,
    collectBillingAddress: false
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-payments.service': { updateCollectBillingAddress: mockUpdateCollectBillingAddress }
  })
  .build()

describe('Controller: settings/card-payments/collect-billing-address', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })
    it('should call the response method', () => {
      expect(mockResponse).to.have.been.calledOnce  // eslint-disable-line
    })
    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-payments/collect-billing-address')
    })

    it('should pass context data to the response method', () => {
      const context = mockResponse.args[0][3]
      expect(context).to.have.property('currentState').to.equal('off')
      expect(context).to.have.property('backLink').to.equal(`/service/${SERVICE_EXTERNAL_ID}/account/test/settings/card-payments`)
    })
  })
  describe('post', () => {
    before(() => {
      nextRequest({
        body: { collectBillingAddress: 'on' }
      })
      call('post')
    })

    it('should update allow Collect billing address enabled', () => {
      expect(mockUpdateCollectBillingAddress.calledOnce).to.be.true // eslint-disable-line
      expect(mockUpdateCollectBillingAddress.calledWith(SERVICE_EXTERNAL_ID, true)).to.be.true // eslint-disable-line
    })

    it('should redirect to the card payments index page', () => {
      expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.cardPayments.index)
    })
  })
})
