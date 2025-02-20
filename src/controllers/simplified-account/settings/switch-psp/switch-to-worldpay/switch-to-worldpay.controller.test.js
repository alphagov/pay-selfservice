const sinon = require('sinon')
const ControllerTestBuilder = require('@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class')
const formatAccountPathsFor = require('@utils/format-account-paths-for')
const paths = require('@root/paths')
const formatPSPName = require('@utils/format-PSP-name')
const GatewayAccountSwitchPaymentProviderRequest = require('@models/gateway-account/GatewayAccountSwitchPaymentProviderRequest.class')
const { GatewayAccountCredential } = require('@models/gateway-account-credential/GatewayAccountCredential.class')
const { formatSimplifiedAccountPathsFor } = require('@utils/simplified-account/format')
const { RESTClientError } = require('@govuk-pay/pay-js-commons/lib/utils/axios-base-client/errors')
const { STRIPE, WORLDPAY } = require('@models/constants/payment-providers')

const mockResponse = sinon.spy()
const mockWorldpayTasks = {
  tasks: ['foo', 'bar', 'baz'],
  incompleteTasks: true
}

const mockGatewayAccountsService = {
  postSwitchPSP: sinon.stub().resolves()
}

const ACCOUNT_TYPE = 'live'
const ACCOUNT_EXTERNAL_ID = 'account-id-123abc'
const USER_EXTERNAL_ID = 'user-id-123abc'
const SWITCHING_CREDENTIAL_EXTERNAL_ID = 'credential-id-123abc'
const SWITCHING_CREDENTIAL_PAYMENT_PROVIDER = WORLDPAY
const SERVICE_EXTERNAL_ID = 'service-id-123abc'

const {
  req,
  res,
  next,
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
    }
  })
  .withUser({
    externalId: USER_EXTERNAL_ID
  })
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@models/WorldpayTasks.class': { WorldpayTasks: sinon.stub().returns(mockWorldpayTasks) },
    '@services/gateway-accounts.service': mockGatewayAccountsService
  })
  .build()

describe('Controller: settings/switch-psp/switch-to-worldpay', () => {
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
        'simplified-account/settings/switch-psp/switch-to-worldpay/index'
      )
    })

    it('should pass the context data to the response method', () => {
      const context = mockResponse.args[0][3]
      sinon.assert.match(context, {
        isMoto: true,
        currentPsp: STRIPE,
        incompleteTasks: true,
        tasks: ['foo', 'bar', 'baz'],
        transactionsUrl: formatAccountPathsFor(paths.account.transactions.index, ACCOUNT_EXTERNAL_ID)
      })
    })

    describe('when messages are available', () => {
      before(() => {
        nextResponse({
          locals: {
            flash: {
              messages: 'blah'
            }
          }
        })
        call('get')
      })

      it('should pass messages to the response method', () => {
        sinon.assert.match(mockResponse.args[0][3], { messages: 'blah' })
      })
    })
  })

  describe('post', () => {
    describe('when all tasks are complete', () => {
      before(() => {
        mockWorldpayTasks.incompleteTasks = false
        call('post')
      })

      it('should call postSwitchPSP', () => {
        const expectedRequest = new GatewayAccountSwitchPaymentProviderRequest()
          .withUserExternalId(USER_EXTERNAL_ID)
          .withGatewayAccountCredentialExternalId(SWITCHING_CREDENTIAL_EXTERNAL_ID)
        sinon.assert.calledOnceWithExactly(mockGatewayAccountsService.postSwitchPSP,
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
      before(() => {
        mockWorldpayTasks.incompleteTasks = true
        call('post')
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
      before(() => {
        mockWorldpayTasks.incompleteTasks = false
        const error = new RESTClientError('whoops')
        mockGatewayAccountsService.postSwitchPSP.rejects(error)
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
