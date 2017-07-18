'use strict'

const proxyquire = require('proxyquire');
const sinon = require('sinon')
const {expect} = require('chai')
const Service = require('../../../../app/models/Service.class')
const random = require('../../../../app/utils/random')
const mockResponses = {}
const mockServiceService = {}
const editServiceNameCtrl = proxyquire('../../../../app/controllers/edit_service_name_controller', {
  '../utils/response': mockResponses,
  '../services/service_service': mockServiceService
})
let req, res


describe('Controller: editServiceName, Method: get', () => {



  describe('when the service name is not empty', () => {

    before(done => {
      mockServiceService.updateServiceName = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({external_id: random.randomUuid(), name: 'Example Service'}),
        body: {
          'service-name': 'A brand spanking new service name'
        }
      }
      res = {
        redirect: sinon.spy()
      }
      const result = editServiceNameCtrl.post(req, res)
      if(result) {
        result.then(() => done()).catch(done)
      } else {
        done(new Error('Didn\'t return a promise'))
      }
    })

    it(`should call 'res.redirect' with '/my-service'`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include('/my-services')
    })

  })

  describe('when the service name is not empty, but the update call fails', () => {

    before(done => {
      mockServiceService.updateServiceName = sinon.stub().rejects(new Error('somet went wrong'))
      mockResponses.renderErrorView = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({external_id: random.randomUuid(), name: 'Example Service'}),
        body: {
          'service-name': 'A brand spanking new service name'
        }
      }
      res = {}
      const result = editServiceNameCtrl.post(req, res)
      if(result) {
        result.then(() => done()).catch(done)
      } else {
        done(new Error('Didn\'t return a promise'))
      }
    })

    it(`should call 'responses.renderErrorView' with req, res and the error received from the client`, () => {
      expect(mockResponses.renderErrorView.called).to.equal(true)
      expect(mockResponses.renderErrorView.args[0]).to.include(req)
      expect(mockResponses.renderErrorView.args[0]).to.include(res)
      expect(mockResponses.renderErrorView.args[0][2] instanceof Error).to.equal(true)
      expect(mockResponses.renderErrorView.args[0][2].message).to.equal('somet went wrong')
    })

  })

  describe('when the service name is empty', () => {

    before(done => {
      mockServiceService.updateServiceName = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        service: new Service({external_id: random.randomUuid(), name: 'Example Service'}),
        body: {
          'service-name': ''
        }
      }
      res = {
        redirect: sinon.spy()
      }
      const result = editServiceNameCtrl.post(req, res)
      if(result) {
        done(new Error('Returned a promise'))
      } else {
        done()
      }
    })

    it(`should call 'res.redirect' with a properly formatted edit-service url`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include(`/service/${req.service.externalId}/edit-name`)
    })

    it(`should set prexisting pageData that includes the 'current_name' and errors`, () => {
      expect(req.session.pageData.editServiceName).to.have.property('current_name').to.equal(req.body['service-name'])
      expect(req.session.pageData.editServiceName).to.have.property('errors').to.deep.equal({
        service_name: {
          'required-field-left-blank': true
        }
      })
    })

  })






})