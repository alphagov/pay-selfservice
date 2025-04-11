const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/Service.class')
const sinon = require('sinon')
const paths = require('@root/paths')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')

const ACCOUNT_TYPE = 'test'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const EN_SERVICE_NAME = 'My Cool Service'
const CY_SERVICE_NAME = 'Fy Ngwasanaeth Cwl'

const mockResponse = sinon.stub()
const mockUpdateServiceName = sinon.stub()

const { req, res, call, nextRequest } = new ControllerTestBuilder('@controllers/simplified-account/settings/service-name/edit/edit-service-name.controller')
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

describe('Controller: edit service name', () => {
  describe('get', () => {
    describe('when editing English service name', () => {
      before(async () => {
        await call('get')
      })

      it('should call the response method', () => {
        mockResponse.should.have.been.calledOnce // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/service-name/edit-service-name')
      })

      it('should pass context data to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          editCy: false,
          serviceName: EN_SERVICE_NAME,
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type),
          submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type),
          removeCyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.removeCy, req.service.externalId, req.account.type)
        })
      })
    })

    describe('when editing Welsh service name', () => {
      let callContext
      before(async () => {
        nextRequest({
          query: {
            cy: 'true'
          }
        })
        callContext = await call('get')
      })

      it('should call the response method', () => {
        mockResponse.should.have.been.calledOnce // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(callContext.req, res, 'simplified-account/settings/service-name/edit-service-name')
      })

      it('should pass context data to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          editCy: true,
          serviceName: CY_SERVICE_NAME,
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type),
          submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type),
          removeCyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.removeCy, req.service.externalId, req.account.type)
        })
      })
    })
  })

  describe('post', () => {
    describe('when entering a valid English service name', () => {
      before(async () => {
        nextRequest({
          body: {
            serviceName: 'New English Name',
            cy: 'false'
          }
        })
        await call('post')
      })

      it('should update the service name', () => {
        mockUpdateServiceName.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockUpdateServiceName.should.have.been.calledWith(SERVICE_EXTERNAL_ID, 'New English Name', CY_SERVICE_NAME)
      })

      it('should redirect to the service name index page', () => {
        res.redirect.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
      })
    })
    describe('when entering a valid Welsh service name', () => {
      before(async () => {
        nextRequest({
          body: {
            serviceName: 'New Welsh Name',
            cy: 'true'
          }
        })
        await call('post')
      })

      it('should update the service name', () => {
        mockUpdateServiceName.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockUpdateServiceName.should.have.been.calledWith(SERVICE_EXTERNAL_ID, EN_SERVICE_NAME, 'New Welsh Name')
      })

      it('should redirect to the service name index page', () => {
        res.redirect.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE))
      })
    })

    describe('when submitting an invalid service name', () => {
      let callContext
      before(async () => {
        nextRequest({
          body: {
            serviceName: 'this is a really really really long service name that is longer than fifty characters',
            cy: 'false'
          }
        })
        callContext = await call('post')
      })

      it('should not update the service name', () => {
        mockUpdateServiceName.should.not.have.been.called // eslint-disable-line no-unused-expressions
      })

      it('should render the edit page with errors', () => {
        mockResponse.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockResponse.should.have.been.calledWith(callContext.req, res, 'simplified-account/settings/service-name/edit-service-name')
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          editCy: false,
          serviceName: 'this is a really really really long service name that is longer than fifty characters',
          errors: {
            summary: [{ href: '#service-name', text: 'Service name must be 50 characters or fewer' }],
            formErrors: { serviceName: 'Service name must be 50 characters or fewer' }
          },
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.index, req.service.externalId, req.account.type),
          submitLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.edit, req.service.externalId, req.account.type),
          removeCyLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.serviceName.removeCy, req.service.externalId, req.account.type)
        })
      })
    })
  })
})
