import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import { expect } from 'chai'

const mockResponse = sinon.stub()
const setRefundEmailEnabledStub = sinon.stub().resolves()

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const { req, res, call, nextRequest } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/email-notifications/refund-emails/refund-emails.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    emailCollectionMode: 'MANDATORY',
    emailNotifications: {
      refundIssued: {
        enabled: true,
      },
    },
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/email.service': { setRefundEmailEnabledByServiceIdAndAccountType: setRefundEmailEnabledStub },
  })
  .build()

describe('Controller: settings/email-notifications/refund-emails', () => {
  describe('get', () => {
    it('should call the response method', async () => {
      await call('get')
      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', async () => {
      await call('get')

      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/email-notifications/refund-email-toggle')
    })

    it('should pass context data to the response method', async () => {
      await call('get')

      expect(mockResponse.args[0][3]).to.have.property('refundEmailEnabled').to.equal(true)
      expect(mockResponse.args[0][3]).to.have.property('emailCollectionMode').to.equal('MANDATORY')
      expect(mockResponse.args[0][3])
        .to.have.property('backLink')
        .to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })

  describe('post', () => {
    beforeEach(() => {
      nextRequest({
        body: {
          refundEmailToggle: 'false',
        },
      })
    })

    it('should update refund email enabled', async () => {
      await call('post')

      expect(setRefundEmailEnabledStub.calledOnce).to.be.true
      expect(setRefundEmailEnabledStub.calledWith(SERVICE_EXTERNAL_ID, ACCOUNT_TYPE, 'false')).to.be.true
    })

    it('should redirect to the email notifications landing page', async () => {
      await call('post')

      expect(res.redirect.calledOnce).to.be.true
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })
})
