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

  const gatewayAccountCredentials = [{
    payment_provider: 'stripe'
  }]
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, gatewayAccountExternalId }),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe', gatewayAccountCredentials }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe', gatewayAccountCredentials }),
      transactionsSummaryStubs.getDashboardStatistics(),
      stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
        gatewayAccountId,
        responsiblePerson: false,
        bankAccount: false,
        vatNumber: false,
        companyNumber: false,
        director: false,
        organisationDetails: false,
        governmentEntityDocument: false
      }),
      stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'stripe-account-id')
    ])
  })

  it('should display the banner', () => {
    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

    cy.get('h2').contains('Enter more information to enable payments to your bank account')

    cy.get('[data-cy=stripe-setup-list]').within(() => {
      cy.get('li').should('have.length', 6)
      cy.get('li').eq(0).should('have.text', 'organisation bank details')
      cy.get('li').eq(1).should('have.text', 'the name, date of birth and home address of the person in your organisation legally responsible for payments (called your ‘responsible person’)')
      cy.get('li').eq(2).should('have.text', 'the name, date of birth and work email address of the director of your service (or someone at director level)')
      cy.get('li').eq(3).should('have.text', 'VAT number (if applicable)')
      cy.get('li').eq(4).should('have.text', 'Company registration number (if applicable)')
      cy.get('li').eq(5).should('have.text', 'government entity document')
    })

    cy.get('[data-cy=stripe-setup-cofirm-org-details]').should('contain', 'You must also confirm that the name and address of your organisation in GOV.UK Pay exactly match your government entity document.')
  })

  it('should redirect to bank account details page when "Add details" button clicked', () => {
    cy.get('#add-account-details').click()
    cy.get('h1').contains('Enter your organisation’s banking details')
  })
})
