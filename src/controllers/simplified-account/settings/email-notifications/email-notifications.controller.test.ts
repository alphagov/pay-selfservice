import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import { expect } from 'chai'

const mockResponse = sinon.stub()
const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const { req, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/email-notifications/email-notifications.controller'
)
  .withServiceExternalId(SERVICE_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    emailCollectionMode: 'MANDATORY',
    emailNotifications: {
      paymentConfirmed: { enabled: true },
      refundIssued: { enabled: true },
    },
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .withUser()
  .build()

describe('Controller: settings/email-notifications', () => {
  describe('get', () => {
    beforeEach(async () => {
      await call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/email-notifications/index')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('emailCollectionMode').to.equal('MANDATORY')
      expect(mockResponse.args[0][3]).to.have.property('confirmationEmailEnabled').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('refundEmailEnabled').to.equal(true)
    })
  })
})
