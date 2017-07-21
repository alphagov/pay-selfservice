'use strict'

const proxyquire = require('proxyquire')
const sinon = require('sinon')
const {expect} = require('chai')
const mockResponses = {}
const createServiceCtrl = proxyquire('../../../../app/controllers/create_service_controller', {
  '../utils/response': mockResponses
})
let req, res

describe('Controller: createService, Method: get', () => {
  describe('when there is no pre-existing pageData', () => {
    before(() => {
      mockResponses.response = sinon.spy()
      res = {}
      req = {}
      createServiceCtrl.get(req, res)
    })

    it('should call the responses.response method', () => {
      expect(mockResponses.response.called).to.equal(true)
    })

    it('should pass req, res and \'add_service\' to the responses.response method', () => {
      expect(mockResponses.response.args[0]).to.include(req)
      expect(mockResponses.response.args[0]).to.include(res)
      expect(mockResponses.response.args[0]).to.include('services/add_service')
    })

    it(`should pass pageData to the responses.response method with a 'current_name' property equal to ''`, () => {
      expect(mockResponses.response.args[0][3]).to.have.property('current_name').to.equal('')
    })

    it(`should pass pageData to the responses.response method that does not have an 'errors' property`, () => {
      expect(mockResponses.response.args[0][3]).to.not.have.property('errors')
    })

    it(`should pass pageData to the responses.response method that has properly formatted 'submit_link' and 'my_services' properties`, () => {
      expect(mockResponses.response.args[0][3]).to.have.property('submit_link').to.equal(`/my-services/create`)
      expect(mockResponses.response.args[0][3]).to.have.property('my_services').to.equal('/my-services')
    })
  })

  describe('when there is pre-existing pageData', () => {
    before(() => {
      mockResponses.response = sinon.spy()
      res = {}
      req = {
        session: {
          pageData: {
            createServiceName: {
              current_name: 'Blah',
              errors: {
                service_name: {
                  'invalid': true
                }
              }
            }
          }
        }
      }
      createServiceCtrl.get(req, res)
    })

    it('should call the responses.response method', () => {
      expect(mockResponses.response.called).to.equal(true)
    })

    it(`should pass pageData to the responses.response method with a 'current_name' property equal to the name in the pre-existing pageData`, () => {
      expect(mockResponses.response.args[0][3]).to.have.property('current_name').to.equal('Blah')
    })

    it(`should pass pageData to the responses.response method with 'errors' property equal to the 'errors' property of the pre-existing pageData`, () => {
      expect(mockResponses.response.args[0][3]).to.have.property('errors').to.deep.equal({
        service_name: {
          'invalid': true
        }
      })
    })

    it(`should delete the pre-existing pageData from the session`, () => {
      expect(req.session.pageData).to.not.have.property('createServiceName')
    })
  })
})
