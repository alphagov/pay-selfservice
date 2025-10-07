import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import paths from '@root/paths'
import { expect } from 'chai'

const mockResponse = sinon.stub()

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const SERVICE_NAME = 'Slipspace Permit Applications'

const { req, res, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/email-notifications/templates/templates.controller'
)
  .withService({
    name: SERVICE_NAME,
    externalId: SERVICE_EXTERNAL_ID,
  })
  .withAccount({
    type: ACCOUNT_TYPE,
    emailCollectionMode: 'MANDATORY',
    emailNotifications: {
      paymentConfirmed: {
        enabled: true,
        templateBody: null,
      },
    },
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/email-notifications/templates', () => {
  describe('get', () => {
    it('should call the response method', async () => {
      await call('get')

      expect(mockResponse.called).to.be.true
    })

    it('should pass req, res and template path to the response method', async () => {
      await call('get')

      expect(mockResponse.args[0]).to.include(req)
      expect(mockResponse.args[0]).to.include(res)
      expect(mockResponse.args[0]).to.include('simplified-account/settings/email-notifications/templates')
    })

    it('should pass context data to the response method', async () => {
      await call('get')

      expect(mockResponse.args[0][3]).to.have.property('customEmailText').to.equal(null)
      expect(mockResponse.args[0][3]).to.have.property('serviceName').to.equal(SERVICE_NAME)
      expect(mockResponse.args[0][3])
        .to.have.property('backLink')
        .to.contain(paths.simplifiedAccount.settings.emailNotifications.index)
    })
  })
})
