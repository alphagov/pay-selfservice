const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const Service = require('@models/Service.class')

const mockResponse = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/worldpay-details.controller')
  .withService(new Service({
    external_id: SERVICE_ID
  }))
  .withAccountType(ACCOUNT_TYPE)
  .withAccount({
    type: ACCOUNT_TYPE,
    allowMoto: true
  })
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/worldpay-details', () => {
  before(() => {
    call('get')
  })

  describe('get', () => {
    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/worldpay-details/index')
    })

    it('should pass context data to the response method', () => {
      const tasks = [{
        href: '#',
        id: 'worldpay-credentials',
        linkText: 'Link your Worldpay account with GOV.UK Pay',
        complete: false
      }]
      expect(mockResponse.args[0][3]).to.have.property('tasks').to.deep.equal(tasks)
      expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
    })
  })
})
