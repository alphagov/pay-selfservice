'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const { expect } = require('chai')
const random = require('../../../../app/utils/random')
const mockResponses = {}
const mockServiceService = {}
const mockUserService = {}
let req, res, next

const getController = function (mockResponses, mockServiceService, mockUserService) {
  return proxyquire('../../../../app/controllers/create-service.controller', {
    '../utils/response': mockResponses,
    '../services/service.service': mockServiceService,
    '../services/user.service': mockUserService
  })
}

function initialiseSpies () {
  res = {
    redirect: sinon.spy()
  }
  next = sinon.spy()
  mockResponses.response = sinon.spy()
}

describe('Controller: createService, Method: post', () => {
  describe('when the service name is not empty', () => {
    mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
    mockUserService.assignServiceRole = sinon.stub().resolves()
    const serviceName = 'A brand spanking new service name'
    const welshServiceName = 'Some Cymraeg new service name'

    before(async () => {
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': serviceName,
          'service-name-cy': welshServiceName,
          'welsh-service-name-bool': true
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'res.redirect' with '/my-service'`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include('/my-services')
      sinon.assert.calledWith(mockServiceService.createService, serviceName, welshServiceName, req.user, req.correlationId)
    })
  })

  describe('when the service name is not empty, but the update call fails', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().rejects(new Error('something went wrong'))
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': 'Some Cymraeg new service name'
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'responses.renderErrorView' with req, res and the error received from the client`, () => {
      sinon.assert.calledOnce(next)
      expect(next.firstCall.args[0]).to.be.instanceOf(Error)
    })
  })

  describe('when the service name is not empty, and the create service succeeds, but the assign service role call fails', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().rejects(new Error('something went wrong'))
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': 'Some Cymraeg new service name'
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'responses.renderErrorView' with req, res and the error received from the client`, () => {
      sinon.assert.calledOnce(next)
      expect(next.firstCall.args[0]).to.be.instanceOf(Error)
    })
  })

  describe('when the service name is empty', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        correlationId: random.randomUuid(),
        user: { externalId: '38475y38q4758ow4' },
        body: {
          'service-name': ''
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'res.redirect' with a to create service`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include(`/my-services/create`)
    })

    it(`should set prexisting pageData that includes the 'current_name' and errors`, () => {
      expect(req.session.pageData.createServiceName).to.have.property('current_name').to.equal(req.body['service-name'])
      expect(req.session.pageData.createServiceName).to.have.property('errors').to.deep.equal({ service_name: 'Enter a service name' })
    })
  })

  describe('when the service name is too long', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        correlationId: random.randomUuid(),
        user: { externalId: '38475y38q4758ow4' },
        body: {
          'service-name': 'Lorem ipsum dolor sit amet, consectetuer adipiscing',
          'service-name-cy': 'Lorem ipsum dolor sit amet, consectetuer adipiscing',
          'welsh-service-name-bool': true
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'res.redirect' with a to create service`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include(`/my-services/create`)
    })

    it(`should set prexisting pageData that includes the 'current_name' and errors`, () => {
      expect(req.session.pageData.createServiceName).to.have.property('current_name').to.equal(req.body['service-name'])
      expect(req.session.pageData.createServiceName).to.have.property('errors').to.deep.equal({ 
        service_name: 'Service name must be 50 characters or fewer',
        service_name_cy: 'Welsh service name must be 50 characters or fewer' 
      })
    })
  })

  describe('when the Welsh service name is empty', () => {
    before(async () => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': ''
        }
      }
      initialiseSpies()
      await addServiceCtrl.post(req, res, next)
    })

    it(`should call 'res.redirect' with '/my-service'`, () => {
      expect(res.redirect.called).to.equal(true)
      expect(res.redirect.args[0]).to.include('/my-services')
    })
  })
})
