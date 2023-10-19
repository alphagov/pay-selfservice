'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e' // pragma: allowlist secret
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId })

  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    type: 'test',
    paymentProvider: 'stripe',
  })

  const stripeAccountSetup = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
    gatewayAccountId,
  })

  const stubs = [
    user,
    gatewayAccountByExternalId,
    stripeAccountSetup,
  ]

  cy.task('setupStubs', stubs)
}

describe('Show Mock cards screen for stripe accounts', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display stripe settings page correctly', () => {
    setupYourPspStubs()
    cy.visit(`/account/${gatewayAccountExternalId}/settings`)
    cy.log('Continue to Make a demo payment page via Dashboard')
    cy.get('a').contains('Dashboard').click()
    cy.get('a').contains('Make a demo payment').click()
    cy.log('Continue to Mock Cards page')
    cy.get('a').contains('Continue').click()
    cy.get('h1').should('have.text', 'Mock card numbers')
    cy.get('p').contains(/^4000058260000005/)
  })
})
