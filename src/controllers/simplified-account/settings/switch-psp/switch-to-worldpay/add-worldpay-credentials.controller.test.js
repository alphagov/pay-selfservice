const sinon = require('sinon')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { paths } = require('@root/routes')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const GatewayAccountCredential = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const WorldpayCredential = require('@models/gateway-account-credential/WorldpayCredential.class')
const Credential = require('@models/gateway-account-credential/Credential.class')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')

const ACCOUNT_TYPE = 'live'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = 'credential-id-123abc'
const SWITCHING_CREDENTIAL_PAYMENT_PROVIDER = WORLDPAY
const SERVICE_EXTERNAL_ID = 'service-id-123abc'
const USER_EXTERNAL_ID = 'user-id-123abc'

const mockResponse = sinon.spy()
const getSwitchingCredentialStub = sinon.stub().returns(new GatewayAccountCredential()
  .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
  .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
  .withCredentials(
    new Credential()
      .withOneOffCustomerInitiated(new WorldpayCredential()
        .withMerchantCode('foo')
        .withUsername('bar')
        .withPassword(undefined)
      )
  ))
const mockWorldpayDetailsService = {
  checkCredential: sinon.stub().resolves(true),
  updateOneOffCustomerInitiatedCredentials: sinon.stub().resolves()
}

const {
  req,
  res,
  next,
  nextRequest,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/switch-psp/switch-to-worldpay/add-worldpay-credentials.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    type: ACCOUNT_TYPE,
    providerSwitchEnabled: true,
    paymentProvider: STRIPE,
    allowMoto: true,
    getSwitchingCredential: getSwitchingCredentialStub
  })
  .withUser({
    externalId: USER_EXTERNAL_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/worldpay-details.service': mockWorldpayDetailsService
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay/add-worldpay-credentials', () => {
  describe('get', () => {
    before(() => {
      call('get')
    })

    it('should call the response method', () => {
      sinon.assert.calledOnce(mockResponse)
    })

    it('should pass req, res and template path to the response method', () => {
      sinon.assert.calledWith(mockResponse,
        req,
        res,
        'simplified-account/settings/switch-psp/switch-to-worldpay/add-worldpay-credentials'
      )
    })

    it('should pass the context data to the response method', () => {
      const context = mockResponse.args[0][3]
      sinon.assert.match(context, {
        backLink: formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
      })
    })

    describe('existing credentials', () => {
      before(() => {
        call('get')
      })
      it('should be present in the context object', () => {
        const context = mockResponse.args[0][3]
        sinon.assert.match(context, {
          credentials: {
            merchantCode: 'foo',
            username: 'bar',
            password: undefined
          }
        })
      })
    })
  })

  describe('post', () => {
    describe('with valid MOTO credentials', () => {
      const expectedCredential = new WorldpayCredential()
        .withMerchantCode('helloMOTO')
        .withUsername('s-mcduck')
        .withPassword('topsecret!!!') // pragma: allowlist secret

      before(() => {
        nextRequest({
          body: {
            merchantCode: 'helloMOTO',
            username: 's-mcduck',
            password: 'topsecret!!!' // pragma: allowlist secret
          }
        })
        call('post')
      })

      it('should check inputted credentials', () => {
        sinon.assert.calledOnceWithExactly(mockWorldpayDetailsService.checkCredential,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          expectedCredential
        )
      })

      it('should update switching credential', () => {
        sinon.assert.calledOnceWithExactly(mockWorldpayDetailsService.updateOneOffCustomerInitiatedCredentials,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          SWITCHING_CREDENTIAL_EXTERNAL_ID,
          USER_EXTERNAL_ID,
          expectedCredential
        )
      })

      it('should redirect to switch to worldpay tasks index', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('with invalid MOTO credentials', () => {
      before(() => {
        nextRequest({
          body: {
            merchantCode: 'notamotocode',
            username: 's-mcduck',
            password: 'topsecret!!!' // pragma: allowlist secret
          }
        })
        call('post')
      })

      it('should render response with validation error', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          {
            errors: {
              formErrors: {
                merchantCode: 'Enter a MOTO merchant code. MOTO payments are enabled for this account'
              },
              summary: [{
                text: 'Enter a MOTO merchant code. MOTO payments are enabled for this account',
                href: '#merchant-code'
              }]
            }
          }
        )
      })

      it('should restore user input', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          {
            credentials: {
              merchantCode: 'notamotocode',
              username: 's-mcduck',
              password: 'topsecret!!!' // pragma: allowlist secret
            }
          }
        )
      })
    })

    describe('when the credential check returns false', () => {
      before(() => {
        nextRequest({
          body: {
            merchantCode: 'helloMOTO',
            username: 's-mcduck',
            password: 'topsecret!!!' // pragma: allowlist secret
          }
        })
        mockWorldpayDetailsService.checkCredential.resolves(false)
        call('post')
      })

      it('should render response with validation error', () => {
        sinon.assert.calledWithMatch(mockResponse,
          sinon.match.any,
          sinon.match.any,
          sinon.match.any,
          {
            errors: {
              summary: [{
                text: 'Check your Worldpay credentials, failed to link your account to Worldpay with credentials provided',
                href: '#merchant-code'
              }]
            }
          }
        )
      })
    })

    describe('when there is a problem checking the credential', () => {
      before(() => {
        nextRequest({
          body: {
            merchantCode: 'helloMOTO',
            username: 's-mcduck',
            password: 'topsecret!!!' // pragma: allowlist secret
          }
        })
        const error = new RESTClientError('whoops')
        mockWorldpayDetailsService.checkCredential.rejects(error)
        call('post')
      })

      it('should call next with error', () => {
        sinon.assert.calledOnceWithMatch(next,
          sinon.match.instanceOf(RESTClientError)
            .and(sinon.match.has('message', 'whoops'))
        )
      })
    })

    describe('when there is a problem updating the credential', () => {
      before(() => {
        nextRequest({
          body: {
            merchantCode: 'helloMOTO',
            username: 's-mcduck',
            password: 'topsecret!!!' // pragma: allowlist secret
          }
        })
        const error = new RESTClientError('whoops')
        mockWorldpayDetailsService.updateOneOffCustomerInitiatedCredentials.rejects(error)
        call('post')
      })

      it('should call next with error', () => {
        sinon.assert.calledOnceWithMatch(next,
          sinon.match.instanceOf(RESTClientError)
            .and(sinon.match.has('message', 'whoops'))
        )
      })
    })
  })
})
