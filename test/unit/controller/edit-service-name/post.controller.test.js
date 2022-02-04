'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const Service = require('../../../../app/models/Service.class')
const random = require('../../../../app/utils/random')
const mockResponses = {}
const mockServiceService = {}
const editServiceNameCtrl = proxyquire('../../../../app/controllers/edit-service-name.controller', {
  '../utils/response': mockResponses,
  '../services/service.service': mockServiceService
})
let req, res, next

describe('Controller: editServiceName, Method: get', () => {
  describe('when the service name is not empty', () => {
    before(async function () {
      mockServiceService.updateServiceName = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({ external_id: random.randomUuid(), name: 'Example Service' }),
        body: {
          'service-name': 'A brand spanking new English service name',
          'service-name-cy': 'A brand spanking new Welsh service name'
        }
      }
      res = {
        redirect: sinon.spy()
      }

      await editServiceNameCtrl.post(req, res)
    })

    it('should call \'res.redirect\' with \'/my-service\'', () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include('/my-services')
    })
  })

  describe('when the service name is not empty, but the update call fails', () => {
    before(async function () {
      mockServiceService.updateServiceName = sinon.stub().rejects(new Error('something went wrong'))
      mockResponses.renderErrorView = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({ external_id: random.randomUuid(), name: 'Example Service' }),
        body: {
          'service-name': 'A brand spanking new English service name',
          'service-name-cy': 'A brand spanking new Welsh service name'
        }
      }
      res = {}

      next = sinon.spy()

      await editServiceNameCtrl.post(req, res, next)
    })

    it('should call \'next\' with the error', () => {
      expect(next.called).to.equal(true)
      expect(next.args[0].toString()).to.equal('Error: something went wrong')
    })
  })

  describe('when the service name is empty', () => {
    before(async function () {
      mockServiceService.updateServiceName = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({ external_id: random.randomUuid(), name: 'Example Service' }),
        body: {
          'service-name': '',
          'service-name-cy': ''
        }
      }
      res = {
        redirect: sinon.spy()
      }

      editServiceNameCtrl.post(req, res)
    })

    it('should call \'res.redirect\' with a properly formatted edit-service url', () => {
      sinon.assert.calledWith(res.redirect, `/service/${req.service.externalId}/edit-name`)
    })

    it('should set pre-existing pageData that includes the \'current_name\' and errors', () => {
      expect(req.session.pageData.editServiceName.current_name).to.have.property('en').to.equal(req.body['service-name'])
      expect(req.session.pageData.editServiceName.current_name).to.have.property('cy').to.equal(req.body['service-name-cy'])
      expect(req.session.pageData.editServiceName).to.have.property('errors').to.deep.equal({ service_name: 'Enter a service name' })
    })
  })

  describe('when the service name is too long', () => {
    before(async function () {
      mockServiceService.updateServiceName = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({ external_id: random.randomUuid(), name: 'Example Service' }),
        body: {
          'service-name': 'Lorem ipsum dolor sit amet, consectetuer adipiscing',
          'service-name-cy': 'Lorem ipsum dolor sit amet, consectetuer adipiscing'
        }
      }
      res = {
        redirect: sinon.spy()
      }

      editServiceNameCtrl.post(req, res)
    })

    it('should call \'res.redirect\' with a properly formatted edit-service url', () => {
      sinon.assert.calledWith(res.redirect, `/service/${req.service.externalId}/edit-name`)
    })

    it('should set pre-existing pageData that includes the \'current_name\' and errors', () => {
      expect(req.session.pageData.editServiceName.current_name).to.have.property('en').to.equal(req.body['service-name'])
      expect(req.session.pageData.editServiceName.current_name).to.have.property('cy').to.equal(req.body['service-name-cy'])
      expect(req.session.pageData.editServiceName).to.have.property('errors').to.deep.equal({
        service_name: 'Service name must be 50 characters or fewer',
        service_name_cy: 'Welsh service name must be 50 characters or fewer'
      })
    })
  })
})
