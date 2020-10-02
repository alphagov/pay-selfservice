'use strict'

const sinon = require('sinon')
const mockResponses = {}
let req, res

jest.mock('../utils/response', () => mockResponses);

const getController = function (mockResponses) {
  return require('../../../../app/controllers/create-service.controller');
}

describe('Controller: createService, Method: get', () => {
  describe('when there is no pre-existing pageData', () => {
    beforeAll(() => {
      mockResponses.response = sinon.spy()
      const createServiceCtrl = getController(mockResponses)
      res = {}
      req = {}
      createServiceCtrl.get(req, res)
    })

    it('should call the responses.response method', () => {
      expect(mockResponses.response.called).toBe(true)
    })

    it(
      'should pass req, res and \'add-service\' to the responses.response method',
      () => {
        expect(mockResponses.response.args[0]).toEqual(expect.arrayContaining([req]))
        expect(mockResponses.response.args[0]).toEqual(expect.arrayContaining([res]))
        expect(mockResponses.response.args[0]).toEqual(expect.arrayContaining(['services/add-service']))
      }
    )

    it(
      `should pass pageData to the responses.response method with a 'current_name' property equal to ''`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name').toBe('')
      }
    )

    it(
      `should pass pageData to the responses.response method with a 'current_name_cy' property equal to ''`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name_cy').toBe('')
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
        expect(mockResponses.response.args[0][3]).to.have.property('submit_link').toBe(`/my-services/create`)
        expect(mockResponses.response.args[0][3]).to.have.property('my_services').toBe('/my-services')
      }
    )
  })

  describe('when there is pre-existing pageData', () => {
    beforeAll(() => {
      mockResponses.response = sinon.spy()
      const createServiceCtrl = getController(mockResponses)
      res = {}
      req = {
        session: {
          pageData: {
            createServiceName: {
              current_name: 'Blah',
              current_name_cy: 'Some Cymraeg service name',
              errors: {
                service_name: {
                  'invalid': true
                },
                service_name_cy: {
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
      expect(mockResponses.response.called).toBe(true)
    })

    it(
      `should pass pageData to the responses.response method with a 'current_name' property equal to the name in the pre-existing pageData`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name').toBe('Blah')
      }
    )

    it(
      `should pass pageData to the responses.response method with a 'current_name_cy' property equal to the name in the pre-existing pageData`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('current_name_cy').toBe('Some Cymraeg service name')
      }
    )

    it(
      `should pass pageData to the responses.response method with 'errors' property equal to the 'errors' property of the pre-existing pageData`,
      () => {
        expect(mockResponses.response.args[0][3]).to.have.property('errors').toEqual({
          service_name: {
            'invalid': true
          },
          service_name_cy: {
            'invalid': true
          }
        })
      }
    )

    it(`should delete the pre-existing pageData from the session`, () => {
      expect(req.session.pageData).not.toHaveProperty('createServiceName')
    })
  })
})
