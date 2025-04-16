const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const sinon = require('sinon')
const { expect } = require('chai')
const formatSimplifiedAccountPathsFor = require('@utils/simplified-account/format/format-simplified-account-paths-for')
const paths = require('@root/paths')
const PaymentProvider = require('@models/constants/payment-providers')
const CredentialState = require('@models/constants/credential-state')

const ACCOUNT_TYPE = 'live'
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const ACCOUNT_CREDENTIAL = {
  externalId: 'creds-id',
  paymentProvider: PaymentProvider.WORLDPAY,
  state: CredentialState.CREATED,
  createdDate: '2024-11-29T11:58:36.214Z',
  gatewayAccountId: 1,
  credentials: {}
}

const mockResponse = sinon.spy()

const { req, res, nextRequest, call } = new ControllerTestBuilder('@controllers/simplified-account/settings/worldpay-details/credentials/worldpay-credentials.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    allowMoto: true,
    id: 1,
    gatewayAccountCredentials: [ACCOUNT_CREDENTIAL],
    getCurrentCredential: () => ACCOUNT_CREDENTIAL
  })
  .withStubs({
    '@utils/response': { response: mockResponse }
  })
  .build()

describe('Controller: settings/worldpay-details/credentials', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      expect(mockResponse.called).to.be.true // eslint-disable-line
    })

    it('should pass req, res and template path to the response method', () => {
      expect(mockResponse.args[0][0]).to.deep.equal(req)
      expect(mockResponse.args[0][1]).to.deep.equal(res)
      expect(mockResponse.args[0][2]).to.equal('simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials')
    })

    it('should pass context data to the response method', () => {
      expect(mockResponse.args[0][3]).to.have.property('backLink').to.equal(
        formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
      )
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
              password: ''
            }
          })
          await call('post')

          expect(mockResponse).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials',
            {
              errors: {
                summary: [
                  { text: 'Enter your username', href: '#username' },
                  { text: 'Enter your password', href: '#password' },
                  { text: 'Enter your merchant code', href: '#merchant-code' }
                ],
                formErrors: {
                  username: 'Enter your username',
                  password: 'Enter your password', // pragma: allowlist secret
                  merchantCode: 'Enter your merchant code'
                }
              },
              credentials: {
                merchantCode: '',
                username: '',
                password: ''
              },
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
            })
        })
        it('should render the form with MOTO validation error when merchant code is invalid', async () => {
          nextRequest({
            body: {
              merchantCode: 'invalid-merchant-code',
              username: 'username',
              password: 'password' // pragma: allowlist secret
            }
          })
          await call('post')

          expect(mockResponse).to.have.been.calledWith(
            sinon.match.any,
            sinon.match.any,
            'simplified-account/settings/worldpay-details/one-off-customer-initiated-credentials',
            {
              errors: {
                summary: [
                  { text: 'Enter a MOTO merchant code. MOTO payments are enabled for this account', href: '#merchant-code' }
                ],
                formErrors: {
                  merchantCode: 'Enter a MOTO merchant code. MOTO payments are enabled for this account'
                }
              },
              credentials: {
                merchantCode: 'invalid-merchant-code',
                username: 'username',
                password: 'password' // pragma: allowlist secret
              },
              backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
            })
        })
      })
    })
  })
})
