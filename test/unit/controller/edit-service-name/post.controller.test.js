'use strict'

const sinon = require('sinon')
const Service = require('../../../../app/models/Service.class')
const random = require('../../../../app/utils/random')
const mockResponses = {}
const mockServiceService = {}
jest.mock('../utils/response', () => mockResponses);
jest.mock('../services/service.service', () => mockServiceService);
const editServiceNameCtrl = require('../../../../app/controllers/edit-service-name.controller')
let req, res

describe('Controller: editServiceName, Method: get', () => {
  describe('when the service name is not empty', () => {
    beforeAll(done => {
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
      const result = editServiceNameCtrl.post(req, res)
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
      mockServiceService.updateServiceName = sinon.stub().rejects(new Error('somet went wrong'))
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
      const result = editServiceNameCtrl.post(req, res)
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
        expect(mockResponses.renderErrorView.args[0][2].message).toBe('somet went wrong')
      }
    )
  })

  describe('when the service name is empty', () => {
    beforeAll(done => {
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
      const result = editServiceNameCtrl.post(req, res)
      if (result) {
        done(new Error('Returned a promise'))
      } else {
        done()
      }
    })

    it(
      `should call 'res.redirect' with a properly formatted edit-service url`,
      () => {
        expect(res.redirect.called).toBe(true)
        expect(res.redirect.args[0]).toEqual(expect.arrayContaining([`/service/${req.service.externalId}/edit-name`]))
      }
    )

    it(
      `should set prexisting pageData that includes the 'current_name' and errors`,
      () => {
        expect(req.session.pageData.editServiceName.current_name).to.have.property('en').toBe(req.body['service-name'])
        expect(req.session.pageData.editServiceName.current_name).to.have.property('cy').toBe(req.body['service-name-cy'])
        expect(req.session.pageData.editServiceName).to.have.property('errors').toEqual({ service_name: 'This field cannot be blank' })
      }
    )
  })
})
