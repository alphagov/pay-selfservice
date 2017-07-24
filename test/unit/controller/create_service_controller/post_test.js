'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const {expect} = require('chai')
const random = require('../../../../app/utils/random')
const mockResponses = {}
const mockServiceService = {}
const mockUserService = {}
const addServiceCtrl = proxyquire('../../../../app/controllers/create_service_controller', {
  '../utils/response': mockResponses,
  '../services/service_service': mockServiceService,
  '../services/user_service': mockUserService
})
let req, res

describe('Controller: createService, Method: post', () => {
  describe('when the service name is not empty', () => {
    before(done => {
      mockServiceService.createService = sinon.stub().resolves({external_id: 'r378y387y8weriyi'})
      mockUserService.assignServiceRole = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        user: {externalId: '38475y38q4758ow4'},
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name'
        }
      }
      res = {
        redirect: sinon.spy()
      }
      const result = addServiceCtrl.post(req, res)
      if (result) {
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
      mockServiceService.createService = sinon.stub().rejects(new Error('something went wrong'))
      mockResponses.renderErrorView = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name'
        }
      }
      res = {}
      const result = addServiceCtrl.post(req, res)
      if (result) {
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
      expect(mockResponses.renderErrorView.args[0][2].message).to.equal('something went wrong')
    })
  })

  describe('when the service name is not empty, and the create service succeeds, but the assign service role call fails', () => {
    before(done => {
      mockServiceService.createService = sinon.stub().resolves({external_id: 'r378y387y8weriyi'})
      mockUserService.assignServiceRole = sinon.stub().rejects(new Error('something went wrong'))
      mockResponses.renderErrorView = sinon.spy()
      req = {
        user: {externalId: '38475y38q4758ow4'},
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name'
        }
      }
      res = {}
      const result = addServiceCtrl.post(req, res)
      if (result) {
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
      expect(mockResponses.renderErrorView.args[0][2].message).to.equal('something went wrong')
    })
  })

  describe('when the service name is empty', () => {
    before(done => {
      mockServiceService.createService = sinon.stub().resolves({external_id: 'r378y387y8weriyi'})
      mockUserService.assignServiceRole = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      req = {
        correlationId: random.randomUuid(),
        user: {externalId: '38475y38q4758ow4'},
        body: {
          'service-name': ''
        }
      }
      res = {
        redirect: sinon.spy()
      }
      const result = addServiceCtrl.post(req, res)
      if (result) {
        done(new Error('Returned a promise'))
      } else {
        done()
      }
    })

    it(`should call 'res.redirect' with a to create service`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include(`/my-services/create`)
    })

    it(`should set prexisting pageData that includes the 'current_name' and errors`, () => {
      expect(req.session.pageData.createServiceName).to.have.property('current_name').to.equal(req.body['service-name'])
      expect(req.session.pageData.createServiceName).to.have.property('errors').to.deep.equal({
        service_name: {
          'required-field-left-blank': true
        }
      })
    })
  })
})
