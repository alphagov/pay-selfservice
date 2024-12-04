const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const Service = require('@models/Service.class')
const GatewayAccount = require('@models/GatewayAccount.class')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')

const mockResponse = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const { req, res, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/worldpay-details.controller')
  .withService(new Service({
    external_id: SERVICE_ID
  }))
  .withAccount(new GatewayAccount({
    type: ACCOUNT_TYPE,
    allow_moto: true,
    gateway_account_id: 1,
    gateway_account_credentials: [{
      external_id: 'creds-id',
      payment_provider: 'worldpay',
      state: 'CREATED',
      created_date: '2024-11-29T11:58:36.214Z',
      gateway_account_id: 1,
      credentials: {}
    }]
  }))
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
        href: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.credentials,
          SERVICE_ID, ACCOUNT_TYPE),
        id: 'worldpay-credentials',
        linkText: 'Link your Worldpay account with GOV.UK Pay',
        complete: false
      }]
      expect(mockResponse.args[0][3]).to.have.property('tasks').to.deep.equal(tasks)
      expect(mockResponse.args[0][3]).to.have.property('incompleteTasks').to.equal(true)
    })
  })
})
