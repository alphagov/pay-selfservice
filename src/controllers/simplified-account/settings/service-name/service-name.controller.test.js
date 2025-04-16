const sinon = require('sinon')
const paths = require('@root/paths')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const EN_SERVICE_NAME = 'My Cool Service'
const CY_SERVICE_NAME = 'Fy Ngwasanaeth Cwl'

const mockResponse = sinon.stub()

const { req, res, call, nextResponse } = new ControllerTestBuilder('@controllers/simplified-account/settings/service-name/service-name.controller')
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
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: service name index', () => {
  describe('get', () => {
    describe('when there are no messages', () => {
      before(async () => {
        await call('get')
      })

      it('should call the response method', () => {
        mockResponse.should.have.been.calledOnce
      })

      it('should call the response method with req, res and template path', () => {
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/service-name/index')
      })

      it('should call the response method with the context data', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: [],
          serviceNameEn: EN_SERVICE_NAME,
          serviceNameCy: CY_SERVICE_NAME,
          manageEn: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          manageCy: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE) + '?cy=true'
        })
      })
    })

    describe('when there are messages', () => {
      before(async () => {
        nextResponse({
          locals: {
            flash: {
              messages: ['there is a message']
            }
          }
        })
        await call('get')
      })

      it('should call the response method with the context data including the messages', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          messages: ['there is a message'],
          serviceNameEn: EN_SERVICE_NAME,
          serviceNameCy: CY_SERVICE_NAME,
          manageEn: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE),
          manageCy: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE) + '?cy=true'
        })
      })
    })
  })
})
