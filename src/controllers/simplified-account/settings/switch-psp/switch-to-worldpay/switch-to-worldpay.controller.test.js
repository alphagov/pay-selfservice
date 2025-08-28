const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const paths = require('@root/paths')
const formatPSPName = require('@utils/format-PSP-name')
const GatewayAccountSwitchPaymentProviderRequest = require('@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class')
const GatewayAccountCredential = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')
const CredentialState = require('@models/constants/credential-state')
const Credential = require('@models/gateway-account-credential/Credential.class')
const WorldpayCredential = require('@models/gateway-account-credential/WorldpayCredential.class')
const WorldpayTaskIdentifiers = require('@models/task-workflows/task-identifiers/worldpay-task-identifiers')
const GenericTaskIdentifiers = require('@models/task-workflows/task-identifiers/generic-task-identifiers')
const TaskStatus = require('@models/constants/task-status')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')

const mockResponse = sinon.stub()

const mockGatewayAccountsService = {
  completePaymentServiceProviderSwitch: sinon.stub().resolves()
}

const ACCOUNT_TYPE = GatewayAccountType.LIVE
const ACCOUNT_EXTERNAL_ID = 'account123abc'
const USER_EXTERNAL_ID = 'user456def'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = 'credential789ghi'
const SWITCHING_CREDENTIAL_PAYMENT_PROVIDER = WORLDPAY
const SERVICE_EXTERNAL_ID = 'service123abc'

const {
  req,
  res,
  next,
  nextRequest,
  nextResponse,
  call
} = new ControllerTestBuilder('@controllers/simplified-account/settings/switch-psp/switch-to-worldpay/switch-to-worldpay.controller')
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    externalId: ACCOUNT_EXTERNAL_ID,
    type: ACCOUNT_TYPE,
    providerSwitchEnabled: true,
    paymentProvider: STRIPE,
    allowMoto: true,
    getSwitchingCredential: () => {
      return new GatewayAccountCredential()
        .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
        .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
        .withCredentials({})
    },
    isSwitchingToProvider: () => {
      return false
    }
  })
  .withUser({
    externalId: USER_EXTERNAL_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/gateway-accounts.service': mockGatewayAccountsService
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay', () => {
  describe('get', () => {
    it('should call the response method', async () => {
      await call('get')
      sinon.assert.calledOnce(mockResponse)
    })

    it('should pass req, res and template path to the response method', async () => {
      await call('get')
      sinon.assert.calledWith(mockResponse,
        req,
        res,
        'simplified-account/settings/switch-psp/switch-to-worldpay/index'
      )
    })

    it('should pass the context data to the response method', async () => {
      await call('get')
      const context = mockResponse.args[0][3]
      sinon.assert.match(context, {
        messages: [],
        isMoto: true,
        currentPsp: STRIPE,
        incompleteTasks: true,
        tasks: [
          sinon.match({
            linkText: 'Link your Worldpay account with GOV.UK Pay',
            href: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/switch-psp/switch-to-worldpay/one-off-customer-initiated/${SWITCHING_CREDENTIAL_EXTERNAL_ID}`,
            id: WorldpayTaskIdentifiers.CRED,
            status: TaskStatus.NOT_STARTED
          }),
          sinon.match({
            linkText: 'Make a live payment to test your Worldpay PSP',
            href: `/service/${SERVICE_EXTERNAL_ID}/account/${ACCOUNT_TYPE}/settings/switch-psp/make-a-payment`,
            id: GenericTaskIdentifiers.PAY,
            status: TaskStatus.CANNOT_START
          })
        ],
        transactionsUrl: formatAccountPathsFor(paths.account.transactions.index, ACCOUNT_EXTERNAL_ID)
      })
    })

    describe('when messages are available', () => {
      beforeEach(async () => {
        nextResponse({
          locals: {
            flash: {
              messages: 'blah'
            }
          }
        })
        await call('get')
      })

      it('should pass messages to the response method', () => {
        sinon.assert.match(mockResponse.args[0][3], { messages: 'blah' })
      })
    })
  })

  describe('post', () => {
    describe('when all tasks are complete', () => {
      beforeEach(async () => {
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.VERIFIED)
                .withCredentials(new Credential()
                  .withOneOffCustomerInitiated(new WorldpayCredential()))
            }
          }
        })
        await call('post')
      })

      it('should call completePspSwitch', () => {
        const expectedRequest = new GatewayAccountSwitchPaymentProviderRequest()
          .withUserExternalId(USER_EXTERNAL_ID)
          .withGatewayAccountCredentialExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
        sinon.assert.calledOnceWithExactly(mockGatewayAccountsService.completePaymentServiceProviderSwitch,
          SERVICE_EXTERNAL_ID,
          ACCOUNT_TYPE,
          expectedRequest
        )
      })

      it('should set success message', () => {
        sinon.assert.calledOnceWithExactly(req.flash,
          'messages', {
            state: 'success',
            icon: '&check;',
            heading: `Service connected to ${formatPSPName(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)}`,
            body: 'This service can now take payments'
          }
        )
      })

      it('should redirect to worldpay settings index', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.worldpayDetails.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('when all tasks are not complete', () => {
      beforeEach(async () => {
        await call('post')
      })

      it('should set error message', () => {
        sinon.assert.calledOnceWithExactly(req.flash,
          'messages', {
            state: 'error',
            heading: 'There is a problem',
            body: 'You cannot switch providers until all required tasks are completed'
          }
        )
      })

      it('should redirect to switch to worldpay tasks index', () => {
        sinon.assert.calledOnceWithExactly(res.redirect,
          formatSimplifiedAccountPathsFor(paths.simplifiedAccount.settings.switchPsp.switchToWorldpay.index, SERVICE_EXTERNAL_ID, ACCOUNT_TYPE)
        )
      })
    })

    describe('when there is a problem talking to connector', () => {
      beforeEach(async () => {
        nextRequest({
          account: {
            getSwitchingCredential: () => {
              return new GatewayAccountCredential()
                .withExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
                .withPaymentProvider(SWITCHING_CREDENTIAL_PAYMENT_PROVIDER)
                .withState(CredentialState.VERIFIED)
                .withCredentials(new Credential()
                  .withOneOffCustomerInitiated(new WorldpayCredential()))
            }
          }
        })
        const error = new RESTClientError('whoops')
        mockGatewayAccountsService.completePaymentServiceProviderSwitch.rejects(error)
        await call('post')
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
