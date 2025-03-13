const { expect } = require('chai')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')

const mockResponse = sinon.spy()
const mockEmailService = {
  setEmailCollectionModeByServiceIdAndAccountType: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'

const {
  req,
  res,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/email-notifications/email-collection-mode/email-collection-mode.controller')
  .withServiceExternalId(SERVICE_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    emailCollectionMode: 'MANDATORY'
  })
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/email.service': mockEmailService
  })
  .build()

describe('Controller: settings/email-notifications/email-collection-mode', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/email-notifications/collect-email-page')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('emailCollectionModes')
      expect(mockResponse.args[0][3].emailCollectionModes).to.deep.equal({
        mandatory: 'MANDATORY',
        optional: 'OPTIONAL',
        no: 'OFF'
      })
      expect(mockResponse.args[0][3]).to.have.property('emailCollectionMode').to.equal('MANDATORY')
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })

  describe('post', () => {
    before(() => {
      nextRequest({
        body: {
          emailCollectionMode: 'OPTIONAL'
        }
      })
      call('post')
    })

    it('should update the email collection mode', () => {
      expect(mockEmailService.setEmailCollectionModeByServiceIdAndAccountType.calledOnce).to.be.true // eslint-disable-line
      expect(mockEmailService.setEmailCollectionModeByServiceIdAndAccountType.calledWith(SERVICE_ID, ACCOUNT_TYPE, 'OPTIONAL')).to.be.true // eslint-disable-line
    })

    it('should redirect to the email notifications landing page', () => {
      expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
      expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })
})
