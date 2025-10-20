import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import { expect } from 'chai'
import sinon from 'sinon'
import paths from '@root/paths'

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const GATEWAY_ACCOUNT_ID = '123'

const mockResponse = sinon.stub()
const mockUpdateApplePay = sinon.spy()

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/card-payments/apple-pay.controller'
)
  .withAccount({
    type: ACCOUNT_TYPE,
    id: GATEWAY_ACCOUNT_ID,
    allowApplePay: false,
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/card-payments.service': { updateAllowApplePay: mockUpdateApplePay },
  })
  .build()

describe('Controller: settings/card-payments/apple-pay', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })
    it('should call the response method', () => {
      expect(mockResponse.calledOnce).to.be.true
    })
    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/card-payments/apple-pay')
    })

    it('should pass context data to the response method', () => {
      const context = mockResponse.args[0][3] as unknown
      expect(context).to.have.property('currentState').to.equal('off')
      expect(context)
        .to.have.property('backLink')
        .to.equal(`/service/${SERVICE_EXTERNAL_ID}/account/test/settings/card-payments`)
    })
  })
  describe('post', () => {
    beforeEach(async () => {
      nextRequest({
        body: { applePay: 'on' },
      })
      await call('post')
    })

    it('should update allow Apple Pay enabled', () => {
      expect(mockUpdateApplePay.calledOnce).to.be.true
      expect(mockUpdateApplePay.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, true)).to.be.true
    })

    it('should redirect to the card payments index page', () => {
      expect(res.redirect.calledOnce).to.be.true
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.cardPayments.index)
    })
  })
})
