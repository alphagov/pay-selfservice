import PaymentProvider from '@models/constants/payment-providers'
import CredentialState from '@models/constants/credential-state'
import sinon from 'sinon'
import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import paths from '@root/paths'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'

const CREDENTIAL_EXTERNAL_ID = 'credential123'
const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const ACCOUNT_CREDENTIAL = {
  externalId: CREDENTIAL_EXTERNAL_ID,
  paymentProvider: PaymentProvider.WORLDPAY,
  state: CredentialState.CREATED,
  createdDate: '2024-11-29T11:58:36.214Z',
  gatewayAccountId: 1,
  credentials: {
    oneOffCustomerInitiated: {
      merchantCode: 'testMerchantCode',
      username: 'testUsername',
    },
  },
}

const mockResponse = sinon.spy()
const findCredentialByExternalIdStub = sinon.stub()
findCredentialByExternalIdStub.returns(ACCOUNT_CREDENTIAL)

const { req, res, nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/settings/worldpay-details/credentials/one-off-customer-initiated.controller'
)
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    allowMoto: true,
    id: 1,
    gatewayAccountCredentials: [ACCOUNT_CREDENTIAL],
    getCurrentCredential: () => ACCOUNT_CREDENTIAL,
    findCredentialByExternalId: findCredentialByExternalIdStub,
  })
  .withParams({
    credentialExternalId: CREDENTIAL_EXTERNAL_ID,
  })
  .withUrl(
    `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/worldpay-details/one-off-customer-initiated/${CREDENTIAL_EXTERNAL_ID}`
  )
  .withStubs({
    '@utils/response': { response: mockResponse },
  })
  .build()

describe('Controller: settings/worldpay-details/credentials/one-off-customer-initiated', () => {
  describe('get', () => {
    describe('worldpay details journey', () => {
      before(async () => {
        await call('get')
      })

      it('should call the findCredentialByExternalId method with the request parameter', () => {
        sinon.assert.calledOnceWithExactly(findCredentialByExternalIdStub, CREDENTIAL_EXTERNAL_ID)
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass req, res and template path to the response method', () => {
        sinon.assert.calledWith(
          mockResponse,
          req,
          res,
          'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials'
        )
      })

      it('should pass context data to the response method', () => {
        sinon.assert.calledWith(mockResponse, sinon.match.any, sinon.match.any, sinon.match.any, {
          backLink: formatServiceAndAccountPathsFor(
            paths.simplifiedAccount.settings.worldpayDetails.index,
            SERVICE_EXTERNAL_ID,
            ACCOUNT_TYPE
          ),
          credentials: {
            merchantCode: 'testMerchantCode',
            username: 'testUsername',
          },
        })
      })
    })

    describe('switch psp journey', () => {
      before(async () => {
        nextRequest({
          url: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/switch-psp/one-off-customer-initiated/${CREDENTIAL_EXTERNAL_ID}`,
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
          credentials: {
            merchantCode: 'testMerchantCode',
            username: 'testUsername',
          },
        })
      })
    })
  })

  describe('post', () => {
    describe('for MOTO gateway accounts', () => {
      describe('when submitting invalid data', () => {
        it('should render the form with validation errors when input fields are missing', async () => {
          nextRequest({
            body: {
              merchantCode: '',
              username: '',
              password: '',
            },
          })
          await call('post')

          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials',
            {
              errors: {
                summary: [
                  { text: 'Enter your username', href: '#username' },
                  { text: 'Enter your password', href: '#password' },
                  { text: 'Enter your merchant code', href: '#merchant-code' },
                ],
                formErrors: {
                  username: 'Enter your username',
                  password: 'Enter your password', // pragma: allowlist secret
                  merchantCode: 'Enter your merchant code',
                },
              },
              credentials: {
                merchantCode: '',
                username: '',
                password: '',
              },
              backLink: formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.settings.worldpayDetails.index,
                SERVICE_EXTERNAL_ID,
                ACCOUNT_TYPE
              ),
            }
          )
        })

        it('should render the form with MOTO validation error when merchant code is invalid', async () => {
          nextRequest({
            body: {
              merchantCode: 'invalid-merchant-code',
              username: 'username',
              password: 'password', // pragma: allowlist secret
            },
          })
          await call('post')

          sinon.assert.calledWith(
            mockResponse,
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials',
            {
              errors: {
                summary: [
                  {
                    text: 'Enter a MOTO merchant code. MOTO payments are enabled for this account',
                    href: '#merchant-code',
                  },
                ],
                formErrors: {
                  merchantCode: 'Enter a MOTO merchant code. MOTO payments are enabled for this account',
                },
              },
              credentials: {
                merchantCode: 'invalid-merchant-code',
                username: 'username',
                password: 'password', // pragma: allowlist secret
              },
              backLink: formatServiceAndAccountPathsFor(
                paths.simplifiedAccount.settings.worldpayDetails.index,
                SERVICE_EXTERNAL_ID,
                ACCOUNT_TYPE
              ),
            }
          )
        })
      })
    })
  })
})
