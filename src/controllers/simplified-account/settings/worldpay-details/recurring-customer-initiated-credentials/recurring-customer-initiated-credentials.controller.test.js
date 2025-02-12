const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/Service.class')
const GatewayAccount = require('@models/GatewayAccount.class')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const mockResponse = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/recurring-customer-initiated-credentials/recurring-customer-initiated-credentials.controller')
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

describe('Controller: settings/worldpay-details/recurring-customer-initiated-credentials', () => {
  describe('get', () => {
    describe('when credentials do not exist', () => {
      before(() => {
        call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/worldpay-details/recurring-customer-initiated-credentials')
      })

      it('should pass context data with no credentials to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          credentials: {},
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE)
        })
      })
    })
    describe('when credentials exist', () => {
      before(() => {
        nextRequest({
          account: {
            gatewayAccountCredentials: [{
              credentials: {
                recurringCustomerInitiated: {
                  merchantCode: 'a-merchant-code',
                  username: 'a-username'
                }
              }
            }]
          }
        })
        call('get')
      })
      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/worldpay-details/recurring-customer-initiated-credentials')
      })

      it('should pass context data with no credentials to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          credentials: {
            merchantCode: 'a-merchant-code',
            username: 'a-username'
          },
          backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE)
        })
      })
    })
  })
})
