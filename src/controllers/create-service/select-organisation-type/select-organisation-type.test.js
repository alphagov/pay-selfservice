'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const paths = require('../../../paths')
const mockResponse = {}

const controller = function (mockResponses) {
  return proxyquire('./select-organisation-type.controller', {
    '../../../utils/response': mockResponses
  })
}

const SERVICE_NAME = 'Garden Gnome Removal Service'
const WELSH_SERVICE_NAME = 'Gwasanaeth Tynnu Corachod Gardd'

let req, res

describe('Controller: selectOrganisationType, Method: get', () => {
  describe('when there is no pre-existing pageData', () => {
    it('should redirect to the create service controller', () => {
      const selectOrganisationTypeController = controller(mockResponse)
      res = {
        redirect: sinon.spy()
      }
      selectOrganisationTypeController.get(req, res)
      sinon.assert.calledWith(res.redirect, paths.serviceSwitcher.create.index)
    })
  })

  describe('when there is pre-existing pageData', () => {
    before(() => {
      mockResponse.response = sinon.spy()
      const selectOrganisationTypeController = controller(mockResponse)
      res = {
        render: sinon.spy()
      }
      req = {
        session: {
          pageData: {
            createService: {
              current_name: SERVICE_NAME,
              current_name_cy: WELSH_SERVICE_NAME,
              errors: {
                organisation_type: 'Organisation type is required'
              }
            }
          }
        }
      }
      selectOrganisationTypeController.get(req, res)
    })

    it('should call the response method with appropriate context', () => {
      expect(mockResponse.response.called).to.equal(true)
      const responseContext = mockResponse.response.args[0][3]
      expect(responseContext).to.have.property('current_name').to.equal(SERVICE_NAME)
      expect(responseContext).to.have.property('current_name_cy').to.equal(WELSH_SERVICE_NAME)
      expect(responseContext).to.have.property('errors').to.deep.equal({
        organisation_type: 'Organisation type is required'
      })
      expect(responseContext).to.have.property('back_link').to.equal(paths.serviceSwitcher.create.index)
      expect(responseContext).to.have.property('submit_link').to.equal(paths.serviceSwitcher.create.index)
    })

    it('should remove errors pageData from the session', () => {
      expect(req.session.pageData.createService).to.not.have.property('errors')
    })
  })
})

describe('Controller: selectOrganisationType, Method: post', () => {
  describe('when request passes validation', () => {
    before(async () => {
      mockResponse.response = sinon.spy()
      const selectOrganisationTypeController = controller(mockResponse)
      res = {}
      req = {
        body: {
          'service-name': SERVICE_NAME,
          'service-name-cy': WELSH_SERVICE_NAME,
          'welsh-service-name-bool': true
        }
      }
      selectOrganisationTypeController.post(req, res)
    })

    it('should call the response method with appropriate context and set the session data', () => {
      expect(mockResponse.response.called).to.equal(true)
      const createServiceState = req.session.pageData.createService
      expect(createServiceState).to.have.property('current_name').to.equal(SERVICE_NAME)
      expect(createServiceState).to.have.property('current_name_cy').to.equal(WELSH_SERVICE_NAME)
      expect(createServiceState).to.have.property('service_selected_cy').to.equal(true)
      const responseContext = mockResponse.response.args[0][3]
      expect(responseContext).to.have.property('back_link').to.equal(paths.serviceSwitcher.create.index)
      expect(responseContext).to.have.property('submit_link').to.equal(paths.serviceSwitcher.create.index)
    })
  })
  describe('when request fails validation', () => {
    before(async () => {
      mockResponse.response = sinon.spy()
      const selectOrganisationTypeController = controller(mockResponse)
      res = {
        redirect: sinon.spy()
      }
      req = {
        body: {
          'service-name': 'a veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery long service name oh nooooooooo!!!',
          'service-name-cy': 'a veeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeery long welsh service name oh nooooooooo!!!',
          'welsh-service-name-bool': true
        }
      }
      selectOrganisationTypeController.post(req, res)
    })

    it('should redirect to the create service controller and set the session data', () => {
      expect(mockResponse.response.called).to.equal(false)
      sinon.assert.calledWith(res.redirect, paths.serviceSwitcher.create.index)
      const expectedErrors = req.session.pageData.createService.errors
      expect(expectedErrors).to.have.property('service_name').to.equal('Service name must be 50 characters or fewer')
      expect(expectedErrors).to.have.property('service_name_cy').to.equal('Welsh service name must be 50 characters or fewer')
    })
  })
})
