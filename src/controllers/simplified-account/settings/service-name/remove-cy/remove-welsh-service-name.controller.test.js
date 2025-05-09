const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/Service.class')
const sinon = require('sinon')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const paths = require('@root/paths')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const EN_SERVICE_NAME = 'My Cool Service'
const CY_SERVICE_NAME = 'Fy Ngwasanaeth Cwl'

const mockResponse = sinon.stub()
const mockUpdateServiceName = sinon.stub()

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/service-name/remove-cy/remove-welsh-service-name.controller')
  .withService({
    id: '123',
    externalId: SERVICE_EXTERNAL_ID,
    serviceName: {
      en: EN_SERVICE_NAME,
      cy: CY_SERVICE_NAME
    }
  })
  .withAccountType(ACCOUNT_TYPE)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/service.service': { updateServiceName: mockUpdateServiceName }
  })
  .build()

describe('Controller: remove welsh service name', () => {
  before(async () => {
    await call('post')
  })

  it('should update the welsh service name', () => {
    mockUpdateServiceName.should.have.been.calledOnce
    mockUpdateServiceName.should.have.been.calledWith(SERVICE_EXTERNAL_ID, EN_SERVICE_NAME, '')
  })

  it('should show a success banner', () => {
    req.flash.should.have.been.calledOnce
    req.flash.should.have.been.calledWith('messages', { state: 'success', icon: '&check;', heading: 'Welsh service name removed' })
  })

  it('should redirect to the service name index page', () => {
    res.redirect.should.have.been.calledOnce
    res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
  })
})
