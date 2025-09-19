import CredentialState from '@models/constants/credential-state'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const GoLiveStage = require('@models/constants/go-live-stage')
const PaymentProviders = require('@models/constants/payment-providers')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-gateway-account-external-id'
const serviceExternalId = 'service123abc'
const dashboardUrl =  (gatewayAccountType) => `/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`

function getStubsForDashboard (gatewayAccountId, type, paymentProvider, goLiveStage, pspTestAccountStage, createdDate) {
  const stubs = []

  stubs.push(
    userStubs.getUserSuccess({
      userExternalId,
      gatewayAccountId,
      serviceExternalId,
      goLiveStage,
      pspTestAccountStage,
      createdDate
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, type, {
      gateway_account_id: gatewayAccountId,
      type: type,
      payment_provider: paymentProvider,
      external_id: gatewayAccountExternalId,
      gateway_account_credentials: [
        {
          state: CredentialState.ACTIVE,
          payment_provider: paymentProvider,
          credentials: {},
          external_id: 'credential123abc',
        },
      ],
    }),
    transactionsSummaryStubs.getDashboardStatistics(),
    gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId }))
  return stubs
}

describe('the links are displayed correctly on the dashboard', () => {
  describe('card gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should display 3 links for a live service in sandbox mode', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, GatewayAccountType.TEST, PaymentProviders.SANDBOX, GoLiveStage.LIVE))

      cy.visit(dashboardUrl(GatewayAccountType.TEST))
      cy.get('.links__box').should('have.length', 3)

      cy.get('#switch-mode').should('exist')
      cy.get('#switch-mode').should('contain.text', 'Exit sandbox mode')
      cy.get('#switch-mode').should('have.class', 'flex-grid--column-third')

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-third')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-third')
    })

    it('should display 2 links for a live service in live mode', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, GatewayAccountType.LIVE, PaymentProviders.WORLDPAY, GoLiveStage.LIVE))

      cy.visit(dashboardUrl(GatewayAccountType.LIVE))
      cy.get('.links__box').should('have.length', 2)

      cy.get('#switch-mode').should('exist')
      cy.get('#switch-mode').should('contain.text', 'Enter sandbox mode')
      cy.get('#switch-mode').should('have.class', 'flex-grid--column-half')

      cy.get('#payment-links-link').should('exist')
      cy.get('#payment-links-link').should('have.class', 'flex-grid--column-half')
    })

    it('should display 3 links for a test sandbox account created since onboarding flow changed on 29/08/2024', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, GatewayAccountType.TEST, PaymentProviders.SANDBOX, GoLiveStage.NOT_STARTED, null, '2024-08-30'))

      cy.visit(dashboardUrl(GatewayAccountType.TEST))
      cy.get('.links__box').should('have.length', 3)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-third')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-third')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-third')

      cy.get('#request-stripe-test-account').should('not.exist')
    })

    it('should display 4 links for a test sandbox account created before 29/08/2024', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, GatewayAccountType.TEST, PaymentProviders.SANDBOX, GoLiveStage.NOT_STARTED, null, '2024-08-28'))

      cy.visit(dashboardUrl(GatewayAccountType.TEST))
      cy.get('.links__box').should('have.length', 4)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-half')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-half')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-half')

      cy.get('#request-stripe-test-account').should('exist')
      cy.get('#request-stripe-test-account').should('have.class', 'flex-grid--column-half')
    })

    it('should display 2 links for a test non-sandbox account (except Stripe)', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, GatewayAccountType.TEST, PaymentProviders.WORLDPAY, GoLiveStage.NOT_STARTED))

      cy.visit(dashboardUrl(GatewayAccountType.TEST))
      cy.get('.links__box').should('have.length', 2)

      cy.get('#payment-links-link').should('exist')
      cy.get('#payment-links-link').should('have.class', 'flex-grid--column-half')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-half')
    })

    it('should display 3 links (demo payment, test with users and request to go live) for a Stripe test account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, GatewayAccountType.TEST, PaymentProviders.STRIPE, GoLiveStage.NOT_STARTED))

      cy.visit(dashboardUrl(GatewayAccountType.TEST))
      cy.get('.links__box').should('have.length', 3)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-third')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-third')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-third')
    })
  })
})
