const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const GatewayAccount = require('@models/gateway-account/GatewayAccount.class')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const WorldpayCredential = require('@models/gateway-account-credential/WorldpayCredential.class')
const PaymentProviders = require('@models/constants/payment-providers')
const CredentialState = require('@models/constants/credential-state')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')
const formatServiceAndAccountPathsFor = require('@utils/simplified-account/format/format-service-and-account-paths-for')
const mockResponse = sinon.stub()

const USERNAME = 'a-username'
const PASSWORD = 'a-password' // pragma: allowlist secret
const MERCHANT_CODE = 'a-merchant-code'
const ACCOUNT_TYPE = GatewayAccountType.LIVE
const SERVICE_EXTERNAL_ID = 'service123abc'
const USER_EXTERNAL_ID = 'user123abc'
const CREDENTIAL_EXTERNAL_ID = 'credential456def'
const gatewayAccount = new GatewayAccount({
  type: ACCOUNT_TYPE,
  recurring_enabled: true,
  gateway_account_id: 1,
  gateway_account_credentials: [
    {
      external_id: CREDENTIAL_EXTERNAL_ID,
      payment_provider: PaymentProviders.WORLDPAY,
      state: CredentialState.CREATED,
      created_date: '2024-11-29T11:58:36.214Z',
      gateway_account_id: 1,
      credentials: {},
    },
  ],
})

const worldpayDetailsServiceStubs = {
  checkCredential: sinon.stub().returns(true),
  updateRecurringMerchantInitiatedCredentials: sinon.spy(),
}

const { req, res, nextRequest, nextStubs, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials/recurring-merchant-initiated-credentials.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withUser({
    externalId: USER_EXTERNAL_ID,
  })
  .withAccount(gatewayAccount)
  .withUrl(paths.simplifiedAccount.settings.worldpayDetails.recurringMerchantInitiated)
  .withParams({
    credentialExternalId: CREDENTIAL_EXTERNAL_ID,
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/worldpay-details.service': worldpayDetailsServiceStubs,
  })
  .build()

describe('Controller: settings/worldpay-details/recurring-merchant-initiated-credentials', () => {
  describe('get', () => {
    describe('when credentials do not exist', () => {
      let thisCall
      beforeEach(async () => {
        thisCall = await call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(
          thisCall.req,
          thisCall.res,
          'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials'
        )
      })

      it('should pass context data with no credentials to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          credentials: {},
          backLink: formatSimplifiedAccountPathsFor(
            paths.simplifiedAccount.settings.worldpayDetails.index,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          ),
        })
      })
    })
    describe('when credentials exist', () => {
      let thisCall
      beforeEach(async () => {
        nextRequest({
          account: {
            gatewayAccountCredentials: [
              {
                credentials: {
                  recurringMerchantInitiated: {
                    merchantCode: MERCHANT_CODE,
                    username: USERNAME,
                  },
                },
              },
            ],
          },
        })
        thisCall = await call('get')
      })

      it('should call the response method', () => {
        expect(mockResponse.called).to.be.true
      })

      it('should pass req, res and template path to the response method', () => {
        mockResponse.should.have.been.calledWith(
          thisCall.req,
          thisCall.res,
          'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials'
        )
      })

      it('should pass context data with no credentials to the response method', () => {
        mockResponse.should.have.been.calledWith(sinon.match.any, sinon.match.any, sinon.match.any, {
          credentials: {
            merchantCode: MERCHANT_CODE,
            username: USERNAME,
          },
          backLink: formatSimplifiedAccountPathsFor(
            paths.simplifiedAccount.settings.worldpayDetails.index,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          ),
        })
      })
    })

    describe('switch psp journey', () => {
      beforeEach(async () => {
        nextRequest({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/switch-psp/recurring-merchant-initiated/${CREDENTIAL_EXTERNAL_ID}`,
        })

        await call('get')
      })

      it('should call the response method with the switch PSP backlink', () => {
        sinon.assert.calledWith(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          ),
          credentials: sinon.match.any,
        })
      })
    })
  })

  describe('post', () => {
    describe('switch psp journey', () => {
      beforeEach(async () => {
        nextRequest({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/switch-psp/recurring-merchant-initiated/${CREDENTIAL_EXTERNAL_ID}`,
          body: {
            merchantCode: MERCHANT_CODE,
            username: USERNAME,
            password: PASSWORD,
          },
        })
        worldpayDetailsServiceStubs.checkCredential.returns(false)
        await call('post')
      })

      afterEach(() => {
        worldpayDetailsServiceStubs.checkCredential.returns(true)
      })

      it('should call the response method with the switch PSP backlink when rendering form errors', () => {
        mockResponse.should.have.been.calledWith(
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          {
            errors: sinon.match.any,
            credentials: sinon.match.any,
            backLink: formatSimplifiedAccountPathsFor(
              paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE
            ),
          }
        )
      })
    })


    describe('add details journey', () => {
      beforeEach(async () => {
        nextRequest({
          body: {
            merchantCode: MERCHANT_CODE,
            username: USERNAME,
            password: PASSWORD,
          },
        })
      })

      describe('when the worldpay credential check fails', () => {
        beforeEach(async () => {
          worldpayDetailsServiceStubs.checkCredential.returns(false)
          await call('post')
        })
        afterEach(async () => {
          worldpayDetailsServiceStubs.checkCredential.returns(true)
        })
        it('should render the form with an error', () => {
          mockResponse.should.have.been.calledOnce
          mockResponse.should.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/recurring-merchant-initiated-credentials',
            {
              errors: {
                summary: [
                  {
                    text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided',
                    href: '#merchant-code',
                  },
                ],
              },
              credentials: {
                merchantCode: MERCHANT_CODE,
                username: USERNAME,
                password: PASSWORD,
              },
              backLink: formatSimplifiedAccountPathsFor(
                paths.simplifiedAccount.settings.worldpayDetails.index,
                SERVICE_EXTERNAL_ID,
                ACCOUNT_TYPE
              ),
            }
          )
        })
      })

      describe('when the worldpay credential check passes', () => {
        beforeEach(async () => {
          await call('post')
        })
        it('should call the worldpay details service to update the recurring customer initiated credentials', () => {
          worldpayDetailsServiceStubs.updateRecurringMerchantInitiatedCredentials.should.have.been.calledOnce
          const credential = new WorldpayCredential()
            .withMerchantCode(MERCHANT_CODE)
            .withUsername(USERNAME)
            .withPassword(PASSWORD)
          worldpayDetailsServiceStubs.updateRecurringMerchantInitiatedCredentials.should.have.been.calledWith(
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE,
            CREDENTIAL_EXTERNAL_ID,
            USER_EXTERNAL_ID,
            credential
          )
        })
        it('should call the redirect method with the worldpay details index path on success', () => {
          res.redirect.should.have.been.calledWith(
            formatSimplifiedAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE
            )
          )
        })
      })
    })
  })
})
