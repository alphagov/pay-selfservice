'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-gateway-account-external-id'
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

function getStubsForDashboard (gatewayAccountId, type, paymentProvider, goLiveStage, pspTestAccountStage) {
  let stubs = []

  stubs.push(userStubs.getUserSuccess({ userExternalId, gatewayAccountId, goLiveStage, pspTestAccountStage }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      type,
      paymentProvider
    }),
    transactionsSummaryStubs.getDashboardStatistics())

  if (paymentProvider === 'stripe') {
    stubs.push(stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId,
      responsiblePerson: false,
      bankAccount: false,
      vatNumber: false,
      companyNumber: false
    }))
  }

  return stubs
}

describe('the links are displayed correctly on the dashboard', () => {
  describe('card gateway account', () => {
    beforeEach(() => {
      cy.setEncryptedCookies(userExternalId)
    })

    it('should display 2 links for a live sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'live', 'sandbox', 'LIVE'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 2)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-half')
      cy.get('#demo-payment-link').should('not.have.class', 'border-bottom')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-half')
      cy.get('#test-payment-link-link').should('not.have.class', 'border-bottom')
    })

    it('should display 1 link for a live non-sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'live', 'worldpay', 'LIVE'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 1)

      cy.get('#payment-links-link').should('exist')
      cy.get('#payment-links-link').should('have.class', 'flex-grid--column-half')
    })

    it('should display 4 links for a test sandbox account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'test', 'sandbox', 'NOT_STARTED'))

      cy.visit(dashboardUrl)
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
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'test', 'worldpay', 'NOT_STARTED'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 2)

      cy.get('#payment-links-link').should('exist')
      cy.get('#payment-links-link').should('have.class', 'flex-grid--column-half')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-half')
    })

    it('should display 3 links (demo payment, test with users and request to go live) for a Stripe test account', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'test', 'stripe', 'NOT_STARTED'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 3)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-third')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-third')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-third')
    })

    it('should display `Stripe test account requested` section if request has been submitted', () => {
      cy.task('setupStubs', getStubsForDashboard(gatewayAccountId, 'test', 'sandbox', 'NOT_STARTED', 'REQUEST_SUBMITTED'))

      cy.visit(dashboardUrl)
      cy.get('.links__box').should('have.length', 4)

      cy.get('#demo-payment-link').should('exist')
      cy.get('#demo-payment-link').should('have.class', 'flex-grid--column-half')

      cy.get('#test-payment-link-link').should('exist')
      cy.get('#test-payment-link-link').should('have.class', 'flex-grid--column-half')

      cy.get('#request-to-go-live-link').should('exist')
      cy.get('#request-to-go-live-link').should('have.class', 'flex-grid--column-half')

      cy.get('#stripe-test-account-requested').should('exist')
      cy.get('#stripe-test-account-requested').should('have.class', 'flex-grid--column-half')
    })
  })
})
