const proxyquire = require('proxyquire')
const sinon = require('sinon')
const paths = require('../../../../paths')
const { expect } = require('chai')
const { SERVICE_NAME_MAX_LENGTH } = require('../../../../utils/validation/server-side-form-validations')

const ACCOUNT_TYPE = 'test'
const SERVICE_ID = 'service-id-123abc'
const EN_SERVICE_NAME = 'My Cool Service'
const CY_SERVICE_NAME = 'Fy Ngwasanaeth Cwl'

let req, res, responseStub, updateServiceNameStub, serviceNameController

const getController = (stubs = {}) => {
  return proxyquire('./service-name.controller', {
    '../../../../utils/response': { response: stubs.response },
    '../../../../services/service.service': { updateServiceName: stubs.updateServiceName },
    '../../../../utils/simplified-account/format/format-validation-errors': stubs.formatValidationErrors || (() => ({}))
  })
}

const setupTest = (method, additionalReqProps = {}, additionalStubs = {}) => {
  responseStub = sinon.spy()
  updateServiceNameStub = sinon.stub().resolves()
  serviceNameController = getController({
    response: responseStub,
    updateServiceName: updateServiceNameStub,
    ...additionalStubs
  })
  res = {
    redirect: sinon.spy()
  }
  req = {
    account: {
      service_id: SERVICE_ID,
      type: ACCOUNT_TYPE
    },
    service: {
      serviceName: {
        en: EN_SERVICE_NAME,
        cy: CY_SERVICE_NAME
      }
    },
    ...additionalReqProps
  }
  serviceNameController[method](req, res)
}

describe('Controller: settings/service-name', () => {
  describe('get', () => {
    before(() => setupTest('get'))

    it('should call the response method', () => {
      expect(responseStub.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(responseStub.args[0]).to.include(req)
      expect(responseStub.args[0]).to.include(res)
      expect(responseStub.args[0]).to.include('simplified-account/settings/service-name/index')
    })

    it('should pass context data to the response method', () => {
      expect(responseStub.args[0][3]).to.have.property('service_name_en').to.equal(EN_SERVICE_NAME)
      expect(responseStub.args[0][3]).to.have.property('service_name_cy').to.equal(CY_SERVICE_NAME)
      expect(responseStub.args[0][3]).to.have.property('manage_en').to.contain(`service/${SERVICE_ID}/account/${ACCOUNT_TYPE}`)
      expect(responseStub.args[0][3]).to.have.property('manage_en').to.not.contain('?cy=true')
      expect(responseStub.args[0][3]).to.have.property('manage_cy').to.contain(`service/${SERVICE_ID}/account/${ACCOUNT_TYPE}`)
      expect(responseStub.args[0][3]).to.have.property('manage_cy').to.contain('?cy=true')
    })
  })

  describe('getEditServiceName', () => {
    const testEditServiceName = (isWelsh) => {
      const queryParams = isWelsh ? { cy: 'true' } : {}
      before(() => setupTest('getEditServiceName', { query: queryParams }))

      it('should call the response method', () => {
        expect(responseStub.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        expect(responseStub.args[0]).to.include(req)
        expect(responseStub.args[0]).to.include(res)
        expect(responseStub.args[0]).to.include('simplified-account/settings/service-name/edit-service-name')
      })

      it('should pass context data to the response method', () => {
        const context = responseStub.args[0][3]
        expect(context).to.have.property('edit_cy').to.equal(isWelsh)
        expect(context).to.have.property('back_link').to.contain(paths.simplifiedAccount.settings.index)
        expect(context).to.have.property('submit_link').to.contain(paths.simplifiedAccount.settings.serviceName.edit)
        expect(context).to.have.property('service_name').to.equal(isWelsh ? CY_SERVICE_NAME : EN_SERVICE_NAME)
      })
    }

    describe('when editing Welsh service name', () => {
      testEditServiceName(true)
    })

    describe('when editing English service name', () => {
      testEditServiceName(false)
    })
  })

  describe('postEditServiceName', () => {
    describe('when submitting a valid English service name', () => {
      before(() => {
        setupTest('postEditServiceName', {
          body: {
            'service-name-input': 'New English Name',
            cy: 'false'
          }
        })
      })

      it('should update the service name', () => {
        expect(updateServiceNameStub.calledWith(SERVICE_ID, 'New English Name', CY_SERVICE_NAME)).to.be.true // eslint-disable-line
      })

      it('should redirect to the service name index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.serviceName.index)
      })
    })

    describe('when submitting a valid Welsh service name', () => {
      before(() => {
        setupTest('postEditServiceName', {
          body: {
            'service-name-input': 'Enw Cymraeg newydd',
            cy: 'true'
          }
        })
      })

      it('should update the service name', () => {
        expect(updateServiceNameStub.calledWith(SERVICE_ID, EN_SERVICE_NAME, 'Enw Cymraeg newydd')).to.be.true // eslint-disable-line
      })

      it('should redirect to the service name index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.serviceName.index)
      })
    })

    describe('when submitting an invalid service name', () => {
      const mockFormatValidationErrors = sinon.stub().returns({
        errorSummary: ['Error summary'],
        formErrors: { 'service-name-input': 'Error message' }
      })

      before(() => {
        setupTest('postEditServiceName', {
          body: {
            'service-name-input': 'A'.repeat(SERVICE_NAME_MAX_LENGTH + 1),
            cy: 'false'
          }
        },
        {
          formatValidationErrors: mockFormatValidationErrors
        })
      })

      it('should not update the service name', () => {
        expect(updateServiceNameStub.called).to.be.false // eslint-disable-line
      })

      it('should render the edit page with errors', () => {
        expect(responseStub.calledOnce).to.be.true // eslint-disable-line
        const [, , template, context] = responseStub.args[0]
        expect(template).to.equal('simplified-account/settings/service-name/edit-service-name')
        expect(context.errors).to.deep.equal({
          summary: ['Error summary'],
          formErrors: { 'service-name-input': 'Error message' }
        })
      })
    })

    describe('when submitting an empty English service name', () => {
      before(() => {
        setupTest('postEditServiceName', {
          body: {
            'service-name-input': '',
            cy: 'false'
          }
        })
      })

      it('should not update the service name', () => {
        expect(updateServiceNameStub.called).to.be.false // eslint-disable-line
      })

      it('should render the edit page with errors', () => {
        expect(responseStub.calledOnce).to.be.true // eslint-disable-line
        const [, , template] = responseStub.args[0]
        expect(template).to.equal('simplified-account/settings/service-name/edit-service-name')
      })
    })

    describe('when submitting an empty Welsh service name', () => {
      before(() => {
        setupTest('postEditServiceName', {
          body: {
            'service-name-input': '',
            cy: 'true'
          }
        })
      })

      it('should update the service name with an empty Welsh name', () => {
        expect(updateServiceNameStub.calledWith(SERVICE_ID, EN_SERVICE_NAME, '')).to.be.true // eslint-disable-line
      })

      it('should redirect to the service name index page', () => {
        expect(res.redirect.calledOnce).to.be.true // eslint-disable-line
        expect(res.redirect.args[0][0]).to.include(paths.simplifiedAccount.settings.serviceName.index)
      })
    })
  })
})
