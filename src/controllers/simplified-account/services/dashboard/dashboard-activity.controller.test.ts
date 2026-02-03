import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import User from '@models/user/User.class'
import { validUserResponse } from '@test/fixtures/user.fixtures'
import { validGatewayAccount } from '@test/fixtures/gateway-account.fixtures'
import GatewayAccount from '@models/gateway-account/GatewayAccount.class'
import { validServiceResponse } from '@test/fixtures/service.fixtures'
import Service from '@models/service/Service.class'
import CredentialState from '@models/constants/credential-state'
import GoLiveStage from '@models/constants/go-live-stage'
import PaymentProviders from '@models/constants/payment-providers'
import proxyquire from 'proxyquire'
import StripeAccountSetup from '@models/StripeAccountSetup.class'
import { buildGetStripeAccountSetupResponse } from '@test/fixtures/stripe-account-setup.fixtures'
import formatServiceAndAccountPathsFor from '@utils/simplified-account/format/format-service-and-account-paths-for'
import paths from '@root/paths'

const ACCOUNT_EXTERNAL_ID = 'account123abc'
const ACCOUNT_ID = 42
const USER_EXTERNAL_ID = 'user123abc'
const SERVICE_EXTERNAL_ID = 'service123abc'
const ACCOUNT_TYPE = {
  LIVE: 'live',
  TEST: 'test',
}
const WORLDPAY_CREDENTIAL = {
  one_off_customer_initiated: {
    merchant_code: 'a-merchant-code',
    username: 'a-username',
  },
}
const STRIPE_CREDENTIAL = {
  stripe_account_id: 'acct_blahblahblah',
}

const SERVICE = (goLiveStage: string) => {
  return new Service(
    validServiceResponse({
      external_id: SERVICE_EXTERNAL_ID,
      current_go_live_stage: goLiveStage,
      gateway_account_ids: [`${ACCOUNT_ID}`],
    })
  )
}

const ACCOUNT = (accountType: string, paymentProvider: string, credentialState: string, credentials: object = {}) => {
  return new GatewayAccount(
    validGatewayAccount({
      gateway_account_id: ACCOUNT_ID,
      external_id: ACCOUNT_EXTERNAL_ID,
      type: accountType,
      payment_provider: paymentProvider,
      gateway_account_credentials: [
        {
          payment_provider: paymentProvider,
          state: credentialState,
          credentials,
        },
      ],
    })
  )
}

const COMPLETED_STRIPE_ONBOARDING_RESPONSE = new StripeAccountSetup(
  buildGetStripeAccountSetupResponse({
    bank_account: true,
    responsible_person: true,
    company_number: true,
    government_entity_document: true,
    vat_number: true,
    director: true,
    organisation_details: true,
  })
)

const DEFAULT_STRIPE_CAPABILITIES_RESPONSE = {
  chargesEnabled: true,
  hasLegacyPaymentsCapability: false,
}

const DEFAULT_DASHBOARD_TX_SUMMARY_RESPONSE = {
  successfulPayments: {
    count: 6,
    totalInPence: 29400,
  },
  refundedPayments: {
    count: 3,
    totalInPence: 14700,
  },
  netIncome: {
    totalInPence: 14700,
  },
}

const DEFAULT_PRODUCTS_RESPONSE = [
  {
    links: {
      pay: {
        method: 'GET',
        href: 'https://pay.me/pay/reference/blah',
      },
    },
  },
]

const mockResponse = sinon.stub()

const mockLedgerService = {
  dashboardTransactionSummary: sinon.stub().resolves(DEFAULT_DASHBOARD_TX_SUMMARY_RESPONSE),
}
const mockStripeDetailsService = {
  getConnectorStripeAccountSetup: sinon.stub().resolves(COMPLETED_STRIPE_ONBOARDING_RESPONSE),
  getStripeAccountCapabilities: sinon.stub().resolves(DEFAULT_STRIPE_CAPABILITIES_RESPONSE),
}

const mockProductsService = {
  getProducts: sinon.stub().resolves(DEFAULT_PRODUCTS_RESPONSE),
}

const actionsUtilsProxy = proxyquire('@utils/simplified-account/services/dashboard/actions-utils', {
  '@services/stripe-details.service': mockStripeDetailsService,
  '@services/products.service': mockProductsService,
}) as object

const { nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/dashboard/dashboard.controller'
)
  .withUser(
    new User(
      validUserResponse({
        external_id: USER_EXTERNAL_ID,
        service_roles: [
          {
            service: {
              external_id: SERVICE_EXTERNAL_ID,
            },
          },
        ],
      })
    )
  )
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@utils/simplified-account/services/dashboard/actions-utils': actionsUtilsProxy, // this messes with breakpoints
    '@services/transactions.service': mockLedgerService,
  })
  .build()

describe('controller: services/dashboard', () => {
  describe('get', () => {
    describe('sandbox test account, service is not live', () => {
      beforeEach(async () => {
        nextRequest({
          service: SERVICE(GoLiveStage.NOT_STARTED),
          account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.SANDBOX, CredentialState.ACTIVE),
        })
        await call('get')
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass correct template path to the response method', () => {
        sinon.assert.calledWith(
          mockResponse,
          sinon.match.any,
          sinon.match.any,
          'simplified-account/services/dashboard/index'
        )
      })

      it('should enable demo payment, test payment link and request live account dashboard actions', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const dashboardActions = context.dashboardActions as number[]
        sinon.assert.match(dashboardActions, [0, 1, 4])
      })

      it('should set go live status as not started', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const goLiveStatus = context.goLiveStatus as string
        sinon.assert.match(goLiveStatus, 'go-live-not-started')
      })

      it('should set activity', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const activity = context.activity as Record<string, unknown>
        sinon.assert.match(activity, {
          ...DEFAULT_DASHBOARD_TX_SUMMARY_RESPONSE,
          error: false,
        })
      })

      it('should set account status', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const accountStatus = context.accountStatus as Record<string, unknown>
        sinon.assert.match(accountStatus, {
          disabled: false,
          unconfigured: false,
          paymentProvider: PaymentProviders.SANDBOX,
          isSwitching: false,
        })
      })
    })

    describe('sandbox test account, service is live', () => {
      beforeEach(async () => {
        nextRequest({
          service: SERVICE(GoLiveStage.LIVE),
          account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.SANDBOX, CredentialState.ACTIVE),
        })
        await call('get')
      })

      it('should enable switch mode, demo payment, test payment link dashboard actions', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const dashboardActions = context.dashboardActions as number[]
        sinon.assert.match(dashboardActions, [0, 1, 6])
      })

      it('should set go live status as not started', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const goLiveStatus = context.goLiveStatus as string
        sinon.assert.match(goLiveStatus, 'go-live-not-available')
      })

      it('should set account status', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const accountStatus = context.accountStatus as Record<string, unknown>
        sinon.assert.match(accountStatus, {
          disabled: false,
          unconfigured: false,
          paymentProvider: PaymentProviders.SANDBOX,
          isSwitching: false,
        })
      })
    })

    describe('worldpay test service', () => {
      describe('credential configured', () => {
        beforeEach(async () => {
          nextRequest({
            service: SERVICE(GoLiveStage.NOT_STARTED),
            account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.WORLDPAY, CredentialState.ACTIVE, WORLDPAY_CREDENTIAL),
          })
          await call('get')
        })

        it('should enable manage payment links dashboard action', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const dashboardActions = context.dashboardActions as number[]
          sinon.assert.match(dashboardActions, [2])
        })

        it('should set go live status as not started', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const goLiveStatus = context.goLiveStatus as string
          sinon.assert.match(goLiveStatus, 'go-live-not-started')
        })

        it('should set worldpay test service flag to true', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const isWorldpayTestService = context.isWorldpayTestService as boolean
          sinon.assert.match(isWorldpayTestService, true)
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            disabled: false,
            unconfigured: false,
            paymentProvider: PaymentProviders.WORLDPAY,
            isSwitching: false,
          })
        })
      })

      describe('credential not configured', () => {
        beforeEach(async () => {
          nextRequest({
            service: SERVICE(GoLiveStage.NOT_STARTED),
            account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.WORLDPAY, CredentialState.CREATED),
          })
          await call('get')
        })

        it('should set configure psp link', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const links = context.links as Record<string, Record<string, string>>
          sinon.assert.match(
            links.dashboardActions.configurePSPAccount,
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE.TEST
            )
          )
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            unconfigured: true,
            paymentProvider: PaymentProviders.WORLDPAY,
          })
        })
      })
    })

    describe('stripe test account, service is not live', () => {
      beforeEach(async () => {
        nextRequest({
          service: SERVICE(GoLiveStage.NOT_STARTED),
          account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.STRIPE, CredentialState.ACTIVE, STRIPE_CREDENTIAL),
        })
        await call('get')
      })

      it('should enable demo payment, test payment link and request live account dashboard actions', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const dashboardActions = context.dashboardActions as number[]
        sinon.assert.match(dashboardActions, [0, 1, 4])
      })

      it('should set go live status as not started', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const goLiveStatus = context.goLiveStatus as string
        sinon.assert.match(goLiveStatus, 'go-live-not-started')
      })

      it('should set worldpay test service flag to false', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const isWorldpayTestService = context.isWorldpayTestService as boolean
        sinon.assert.match(isWorldpayTestService, false)
      })

      it('should set account status', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const accountStatus = context.accountStatus as Record<string, unknown>
        sinon.assert.match(accountStatus, {
          paymentProvider: PaymentProviders.STRIPE,
          gatewayAccountStripeProgress: {
            governmentEntityDocument: true,
          },
          stripeAccount: {
            chargesEnabled: true,
          },
        })
      })
    })

    describe('stripe test account, service is live', () => {
      beforeEach(async () => {
        nextRequest({
          service: SERVICE(GoLiveStage.LIVE),
          account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.STRIPE, CredentialState.ACTIVE, STRIPE_CREDENTIAL),
        })
        await call('get')
      })

      it('should enable switch mode, demo payment and test payment link dashboard actions', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const dashboardActions = context.dashboardActions as number[]
        sinon.assert.match(dashboardActions, [0, 1, 6])
      })

      it('should set go live status as not started', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const goLiveStatus = context.goLiveStatus as string
        sinon.assert.match(goLiveStatus, 'go-live-not-available')
      })

      it('should set account status', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const accountStatus = context.accountStatus as Record<string, unknown>
        sinon.assert.match(accountStatus, {
          paymentProvider: PaymentProviders.STRIPE,
          gatewayAccountStripeProgress: {
            responsiblePerson: true,
          },
          stripeAccount: {
            hasLegacyPaymentsCapability: false,
          },
        })
      })
    })

    describe('stripe live account', () => {
      describe('onboarding completed', () => {
        beforeEach(async () => {
          nextRequest({
            service: SERVICE(GoLiveStage.LIVE),
            account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.STRIPE, CredentialState.ACTIVE, STRIPE_CREDENTIAL),
          })
          await call('get')
        })

        it('should enable switch mode, manage payment links dashboard action', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const dashboardActions = context.dashboardActions as number[]
          sinon.assert.match(dashboardActions, [2, 6])
        })

        it('should set go live status as not available', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const goLiveStatus = context.goLiveStatus as string
          sinon.assert.match(goLiveStatus, 'go-live-not-available')
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            paymentProvider: PaymentProviders.STRIPE,
            gatewayAccountStripeProgress: {
              organisationDetails: true,
            },
            stripeAccount: {
              chargesEnabled: true,
            },
          })
        })
      })

      describe('onboarding incomplete', () => {
        beforeEach(async () => {
          mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(
            new StripeAccountSetup(buildGetStripeAccountSetupResponse())
          )
          mockStripeDetailsService.getStripeAccountCapabilities.resolves({
            chargesEnabled: false,
          })
          nextRequest({
            service: SERVICE(GoLiveStage.LIVE),
            account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.STRIPE, CredentialState.CREATED, STRIPE_CREDENTIAL),
          })
          await call('get')
        })

        after(() => {
          mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(COMPLETED_STRIPE_ONBOARDING_RESPONSE)
          mockStripeDetailsService.getStripeAccountCapabilities.resolves(DEFAULT_STRIPE_CAPABILITIES_RESPONSE)
        })

        it('should enable switch mode, manage payment links dashboard action', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const dashboardActions = context.dashboardActions as number[]
          sinon.assert.match(dashboardActions, [2, 6])
        })

        it('should set go live status as not available', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const goLiveStatus = context.goLiveStatus as string
          sinon.assert.match(goLiveStatus, 'go-live-not-available')
        })

        it('should set configure psp link', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const links = context.links as Record<string, Record<string, string>>
          sinon.assert.match(
            links.dashboardActions.configurePSPAccount,
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.stripeDetails.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE.LIVE
            )
          )
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            paymentProvider: PaymentProviders.STRIPE,
            unconfigured: true,
            gatewayAccountStripeProgress: {
              organisationDetails: false,
            },
            stripeAccount: {
              chargesEnabled: false,
            },
          })
        })
      })
    })

    describe('worldpay live account', () => {
      describe('credential configured', () => {
        beforeEach(async () => {
          nextRequest({
            service: SERVICE(GoLiveStage.LIVE),
            account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.WORLDPAY, CredentialState.ACTIVE, WORLDPAY_CREDENTIAL),
          })
          await call('get')
        })

        it('should enable switch mode, manage payment links dashboard action', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const dashboardActions = context.dashboardActions as number[]
          sinon.assert.match(dashboardActions, [2, 6])
        })

        it('should set go live status as not available', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const goLiveStatus = context.goLiveStatus as string
          sinon.assert.match(goLiveStatus, 'go-live-not-available')
        })

        it('should set worldpay test service flag to false', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const isWorldpayTestService = context.isWorldpayTestService as boolean
          sinon.assert.match(isWorldpayTestService, false)
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            disabled: false,
            unconfigured: false,
            paymentProvider: PaymentProviders.WORLDPAY,
            isSwitching: false,
          })
        })
      })
      describe('credential not configured', () => {
        beforeEach(async () => {
          nextRequest({
            service: SERVICE(GoLiveStage.LIVE),
            account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.WORLDPAY, CredentialState.CREATED),
          })
          await call('get')
        })

        it('should enable switch mode, manage payment links dashboard action', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const dashboardActions = context.dashboardActions as number[]
          sinon.assert.match(dashboardActions, [2, 6])
        })

        it('should set go live status as not available', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const goLiveStatus = context.goLiveStatus as string
          sinon.assert.match(goLiveStatus, 'go-live-not-available')
        })

        it('should set worldpay test service flag to false', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const isWorldpayTestService = context.isWorldpayTestService as boolean
          sinon.assert.match(isWorldpayTestService, false)
        })

        it('should set configure psp link', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const links = context.links as Record<string, Record<string, string>>
          sinon.assert.match(
            links.dashboardActions.configurePSPAccount,
            formatServiceAndAccountPathsFor(
              paths.simplifiedAccount.settings.worldpayDetails.index,
              SERVICE_EXTERNAL_ID,
              ACCOUNT_TYPE.LIVE
            )
          )
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            disabled: false,
            unconfigured: true,
            paymentProvider: PaymentProviders.WORLDPAY,
            isSwitching: false,
          })
        })
      })
    })

    describe('stripe live account switching to worldpay', () => {
      beforeEach(async () => {
        nextRequest({
          service: SERVICE(GoLiveStage.LIVE),
          account: new GatewayAccount(
            validGatewayAccount({
              gateway_account_id: ACCOUNT_ID,
              external_id: ACCOUNT_EXTERNAL_ID,
              type: ACCOUNT_TYPE.LIVE,
              payment_provider: PaymentProviders.STRIPE,
              provider_switch_enabled: true,
              gateway_account_credentials: [
                {
                  payment_provider: PaymentProviders.STRIPE,
                  state: CredentialState.ACTIVE,
                  credentials: STRIPE_CREDENTIAL,
                },
                {
                  payment_provider: PaymentProviders.WORLDPAY,
                  state: CredentialState.CREATED,
                  credentials: {},
                },
              ],
            })
          ),
        })
        await call('get')
      })

      it('should enable switch mode, manage payment links dashboard action', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const dashboardActions = context.dashboardActions as number[]
        sinon.assert.match(dashboardActions, [2, 6])
      })

      it('should set go live status as not available', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const goLiveStatus = context.goLiveStatus as string
        sinon.assert.match(goLiveStatus, 'go-live-not-available')
      })

      it('should set worldpay test service flag to false', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const isWorldpayTestService = context.isWorldpayTestService as boolean
        sinon.assert.match(isWorldpayTestService, false)
      })

      it('should set account status', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const accountStatus = context.accountStatus as Record<string, unknown>
        sinon.assert.match(accountStatus, {
          disabled: false,
          unconfigured: false,
          paymentProvider: PaymentProviders.STRIPE,
          isSwitching: true,
          gatewayAccountStripeProgress: {
            bankAccount: true,
          },
          stripeAccount: {
            chargesEnabled: true,
          },
        })
      })
    })

    describe('worldpay live account with agent initiated moto enabled', () => {
      beforeEach(async () => {
        nextRequest({
          service: new Service(
            validServiceResponse({
              external_id: SERVICE_EXTERNAL_ID,
              current_go_live_stage: GoLiveStage.LIVE,
              agent_initiated_moto_enabled: true,
              gateway_account_ids: [`${ACCOUNT_ID}`],
            })
          ),
          account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.WORLDPAY, CredentialState.ACTIVE, WORLDPAY_CREDENTIAL),
        })
        await call('get')
      })

      it('should enable switch mode, manage payment links and telephone payment dashboard actions', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const dashboardActions = context.dashboardActions as number[]
        sinon.assert.match(dashboardActions, [2, 5, 6])
      })

      it('should set telephone payment link', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const links = context.links as Record<string, Record<string, string>>
        sinon.assert.match(links.dashboardActions.telephonePaymentLink, DEFAULT_PRODUCTS_RESPONSE[0].links.pay.href)
      })
    })

    describe('edge cases', () => {
      describe('ledger unavailable', () => {
        beforeEach(async () => {
          mockLedgerService.dashboardTransactionSummary.rejects()
          nextRequest({
            service: SERVICE(GoLiveStage.NOT_STARTED),
            account: ACCOUNT(ACCOUNT_TYPE.TEST, PaymentProviders.SANDBOX, CredentialState.ACTIVE),
          })
          await call('get')
        })

        after(() => {
          mockLedgerService.dashboardTransactionSummary.resolves(DEFAULT_DASHBOARD_TX_SUMMARY_RESPONSE)
        })

        it('should call the response method', () => {
          sinon.assert.calledOnce(mockResponse)
        })

        it('should set activity', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const activity = context.activity as Record<string, unknown>
          sinon.assert.match(activity, {
            error: true,
            successfulPayments: undefined,
          })
        })
      })

      describe('connector unavailable', () => {
        beforeEach(async () => {
          mockStripeDetailsService.getConnectorStripeAccountSetup.rejects()
          nextRequest({
            service: SERVICE(GoLiveStage.LIVE),
            account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.STRIPE, CredentialState.CREATED, STRIPE_CREDENTIAL),
          })
          await call('get')
        })

        after(() => {
          mockStripeDetailsService.getConnectorStripeAccountSetup.resolves(COMPLETED_STRIPE_ONBOARDING_RESPONSE)
        })

        it('should call the response method', () => {
          sinon.assert.calledOnce(mockResponse)
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            paymentProvider: PaymentProviders.STRIPE,
            gatewayAccountStripeProgress: undefined,
          })
        })
      })

      describe('stripe unavailable', () => {
        beforeEach(async () => {
          mockStripeDetailsService.getStripeAccountCapabilities.rejects()
          nextRequest({
            service: SERVICE(GoLiveStage.LIVE),
            account: ACCOUNT(ACCOUNT_TYPE.LIVE, PaymentProviders.STRIPE, CredentialState.CREATED, STRIPE_CREDENTIAL),
          })
          await call('get')
        })

        after(() => {
          mockStripeDetailsService.getStripeAccountCapabilities.resolves(DEFAULT_STRIPE_CAPABILITIES_RESPONSE)
        })

        it('should call the response method', () => {
          sinon.assert.calledOnce(mockResponse)
        })

        it('should set account status', () => {
          const context = mockResponse.args[0][3] as Record<string, unknown>
          const accountStatus = context.accountStatus as Record<string, unknown>
          sinon.assert.match(accountStatus, {
            paymentProvider: PaymentProviders.STRIPE,
            stripeAccount: undefined,
          })
        })
      })
    })
  })
})
