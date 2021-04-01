'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

describe('The Stripe psp details banner', () => {
  const gatewayAccountId = '22'
  const gatewayAccountExternalId = 'a-valid-external-id'
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe' }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe' }),
      transactionsSummaryStubs.getDashboardStatistics(),
      stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
        gatewayAccountId,
        responsiblePerson: false,
        bankAccount: false,
        vatNumber: false,
        companyNumber: false
      }),
      stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'stripe-account-id')
    ])
  })

  it('should display the banner', () => {
    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

    cy.get('h2').contains('You must add more details')
    cy.get('#add-account-details').should('exist')
  })

  it('should redirect to bank account details page when "Add details" button clicked', () => {
    cy.get('#add-account-details').click()
    cy.get('h1').contains('What are your bank details?')
  })
})
