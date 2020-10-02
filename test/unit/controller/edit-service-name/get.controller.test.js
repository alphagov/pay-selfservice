'use strict'

const sinon = require('sinon')
const Service = require('../../../../app/models/Service.class')
const random = require('../../../../app/utils/random')
const mockResponses = {}
jest.mock('../utils/response', () => mockResponses);
const editServiceNameCtrl = require('../../../../app/controllers/edit-service-name.controller')
let req, res

describe('Controller: editServiceName, Method: get', () => {
  describe('when there is no pre-existing pageData, but the service has an existing name', () => {
    beforeAll(() => {
      mockResponses.response = sinon.spy()
      res = {}
      req = {
        service: new Service({ external_id: random.randomUuid(), name: 'Example Service', service_name: { en: 'Example En Service', cy: 'Example Cy Service' } })
      }
      editServiceNameCtrl.get(req, res)
    })

    it('should call the responses.response method', () => {
      expect(mockResponses.response.called).toBe(true)
    })

    it(
      'should pass req, res and \'edit-service-name\' to the responses.response method',
      () => {
        expect(mockResponses.response.args[0]).toEqual(expect.arrayContaining([req]))
        expect(mockResponses.response.args[0]).toEqual(expect.arrayContaining([res]))
        expect(mockResponses.response.args[0]).toEqual(expect.arrayContaining(['services/edit-service-name']))
      }
    )

    it(
      `should pass pageData to the responses.response method with a 'current_name' property equal to the name of 'req.service'`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name').toBe(req.service.serviceName)
      }
    )

    it(
      `should pass pageData to the responses.response method that does not have an 'errors' property`,
      () => {
        expect(mockResponses.response.args[0][3]).not.toHaveProperty('errors')
      }
    )

    it(
      `should pass pageData to the responses.response method that has properly formatted 'submit_link' and 'my_services' properties`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('submit_link').toBe(`/service/${req.service.externalId}/edit-name`)
        expect(mockResponses.response.args[0][3]).to.have.property('my_services').toBe('/my-services')
      }
    )
  })

  describe('when there is no pre-existing pageData, but the service has no existing name', () => {
    beforeAll(() => {
      mockResponses.response = sinon.spy()
      res = {}
      req = {
        service: new Service({ external_id: random.randomUuid(), name: 'System Generated', serviceName: { en: 'System Generated', cy: '' } })

      }
      editServiceNameCtrl.get(req, res)
    })

    it('should call the responses.response method', () => {
      expect(mockResponses.response.called).toBe(true)
    })

    it(
      `should pass pageData to the responses.response method with a 'current_name' property equal to the serviceName of 'req.service'`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name').toBe(req.service.serviceName)
      }
    )
  })

  describe('when there is pre-existing pageData', () => {
    beforeAll(() => {
      mockResponses.response = sinon.spy()
      res = {}
      req = {
        service: new Service({ external_id: random.randomUuid(), name: 'Example Service' }),
        session: {
          pageData: {
            editServiceName: {
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
      editServiceNameCtrl.get(req, res)
    })

    it('should call the responses.response method', () => {
      expect(mockResponses.response.called).toBe(true)
    })

    it(
      `should pass pageData to the responses.response method with a 'current_name' property equal to the name in the pre-existing pageData`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name').toBe('Blah')
      }
    )

    it(
      `should pass pageData to the responses.response method with 'errors' property equal to the 'errors' property of the pre-existing pageData`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('errors').toEqual({
          service_name: {
            'invalid': true
          }
        })
      }
    )

    it(`should delete the pre-existing pageData from the session`, () => {
      expect(req.session.pageData).not.toHaveProperty('editServiceName')
    })
  })
})
