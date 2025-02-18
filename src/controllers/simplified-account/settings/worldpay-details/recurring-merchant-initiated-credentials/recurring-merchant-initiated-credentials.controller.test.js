const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const Service = require('@models/Service.class')
const GatewayAccount = require('@models/GatewayAccount.class')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const WorldpayCredential = require('@models/gateway-account-credential/WorldpayCredential.class')
const { WorldpayTasks } = require('@models/WorldpayTasks.class')
const mockResponse = sinon.spy()

const ACCOUNT_TYPE = 'live'
const SERVICE_ID = 'service-id-123abc'
const gatewayAccount = new GatewayAccount({
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
})
const worldpayTasks = new WorldpayTasks(gatewayAccount, SERVICE_ID)
WorldpayTasks.recalculate = () => { return worldpayTasks }

const worldpayDetailsServiceStubs = {
  checkCredential: sinon.stub().returns(true),
  updateRecurringMerchantInitiatedCredentials: sinon.spy()
}

const { req, res, nextRequest, nextStubs, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials/recurring-merchant-initiated-credentials.controller')
  .withService(new Service({
    external_id: SERVICE_ID
  }))
  .withUser({
    externalId: 'a-user-external-id'
  })
  .withAccount(gatewayAccount)
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/worldpay-details/recurring-merchant-initiated-credentials', () => {
  describe('get', () => {
    describe('when credentials do not exist', () => {
      before(() => {
        call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true // eslint-disable-line
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials')
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
                recurringMerchantInitiated: {
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
        mockResponse.should.have.been.calledWith(req, res, 'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials')
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

  describe('post', () => {
    beforeEach(() => {
      nextRequest({
        body: {
          merchantCode: 'a-merchant-code',
          username: 'a-username',
          password: 'a-password' // pragma: allowlist secret
        }
      })
    })

    describe('when the worldpay credential check fails', () => {
      beforeEach(async () => {
        nextStubs({
          '@services/worldpay-details.service': {
            checkCredential: sinon.stub().returns(false),
            updateRecurringMerchantInitiatedCredentials: sinon.spy()
          }
        })
        await call('post')
      })
      it('should render the form with an error', () => {
        mockResponse.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials',
          {
            errors: {
              summary: [
                { text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided', href: '#merchant-code' }
              ]
            },
            credentials: {
              merchantCode: 'a-merchant-code',
              username: 'a-username',
              password: 'a-password' // pragma: allowlist secret
            },
            backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE)
          })
      })
    })

    describe('when the worldpay credential check passes', () => {
      beforeEach(async () => {
        nextStubs({
          '@services/worldpay-details.service': worldpayDetailsServiceStubs
        })
        await call('post')
      })
      it('should call the worldpay details service to update the recurring customer initiated credentials', () => {
        worldpayDetailsServiceStubs.updateRecurringMerchantInitiatedCredentials.should.have.been.calledOnce // eslint-disable-line no-unused-expressions
        const credential = new WorldpayCredential()
          .withMerchantCode('a-merchant-code')
          .withUsername('a-username')
          .withPassword('a-password') // pragma: allowlist secret
        worldpayDetailsServiceStubs.updateRecurringMerchantInitiatedCredentials.should.have.been.calledWith(SERVICE_ID, ACCOUNT_TYPE, 'creds-id', 'a-user-external-id', credential)
      })
      it('should call the redirect method with the worldpay details index path on success', () => {
        res.redirect.should.have.been.calledWith(formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_ID, ACCOUNT_TYPE))
      })
    })
  })
})
