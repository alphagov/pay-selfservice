'use strict'

const sinon = require('sinon')
const random = require('../../../../app/utils/random')
const mockResponses = {}
const mockServiceService = {}
const mockUserService = {}
let req, res

jest.mock('../utils/response', () => mockResponses);
jest.mock('../services/service.service', () => mockServiceService);
jest.mock('../services/user.service', () => mockUserService);

const getController = function (mockResponses, mockServiceService, mockUserService) {
  return require('../../../../app/controllers/create-service.controller');
}

describe('Controller: createService, Method: post', () => {
  describe('when the service name is not empty', () => {
    beforeAll(done => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': 'Some Cymraeg new service name'
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
      expect(res.redirect.called).toBe(true)
      expect(res.redirect.args[0]).toEqual(expect.arrayContaining(['/my-services']))
    })
  })

  describe('when the service name is not empty, but the update call fails', () => {
    beforeAll(done => {
      mockServiceService.createService = sinon.stub().rejects(new Error('something went wrong'))
      mockResponses.renderErrorView = sinon.spy()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': 'Some Cymraeg new service name'
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

    it(
      `should call 'responses.renderErrorView' with req, res and the error received from the client`,
      () => {
        expect(mockResponses.renderErrorView.called).toBe(true)
        expect(mockResponses.renderErrorView.args[0]).toEqual(expect.arrayContaining([req]))
        expect(mockResponses.renderErrorView.args[0]).toEqual(expect.arrayContaining([res]))
        expect(mockResponses.renderErrorView.args[0][2] instanceof Error).toBe(true)
        expect(mockResponses.renderErrorView.args[0][2].message).toBe('something went wrong')
      }
    )
  })

  describe('when the service name is not empty, and the create service succeeds, but the assign service role call fails', () => {
    beforeAll(done => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().rejects(new Error('something went wrong'))
      mockResponses.renderErrorView = sinon.spy()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': 'Some Cymraeg new service name'
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

    it(
      `should call 'responses.renderErrorView' with req, res and the error received from the client`,
      () => {
        expect(mockResponses.renderErrorView.called).toBe(true)
        expect(mockResponses.renderErrorView.args[0]).toEqual(expect.arrayContaining([req]))
        expect(mockResponses.renderErrorView.args[0]).toEqual(expect.arrayContaining([res]))
        expect(mockResponses.renderErrorView.args[0][2] instanceof Error).toBe(true)
        expect(mockResponses.renderErrorView.args[0][2].message).toBe('something went wrong')
      }
    )
  })

  describe('when the service name is empty', () => {
    beforeAll(done => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        correlationId: random.randomUuid(),
        user: { externalId: '38475y38q4758ow4' },
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
      expect(res.redirect.called).toBe(true)
      expect(res.redirect.args[0]).toEqual(expect.arrayContaining([`/my-services/create`]))
    })

    it(
      `should set prexisting pageData that includes the 'current_name' and errors`,
      () => {
        expect(req.session.pageData.createServiceName).to.have.property('current_name').toBe(req.body['service-name'])
        expect(req.session.pageData.createServiceName).to.have.property('errors').toEqual({ service_name: 'This field cannot be blank' })
      }
    )
  })

  describe('when the Welsh service name is empty', () => {
    beforeAll(done => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': ''
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
      expect(res.redirect.called).toBe(true)
      expect(res.redirect.args[0]).toEqual(expect.arrayContaining(['/my-services']))
    })
  })

  describe('when the Welsh service name is filled in', () => {
    beforeAll(done => {
      mockServiceService.createService = sinon.stub().resolves({ external_id: 'r378y387y8weriyi' })
      mockUserService.assignServiceRole = sinon.stub().resolves()
      mockResponses.response = sinon.spy()
      const addServiceCtrl = getController(mockResponses, mockServiceService, mockUserService)
      req = {
        user: { externalId: '38475y38q4758ow4' },
        correlationId: random.randomUuid(),
        body: {
          'service-name': 'A brand spanking new service name',
          'service-name-cy': ''
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
      expect(res.redirect.called).toBe(true)
      expect(res.redirect.args[0]).toEqual(expect.arrayContaining(['/my-services']))
    })
  })
})
