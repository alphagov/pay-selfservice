'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

describe('Stripe - add additional KYC details banner', () => {
  const gatewayAccountId = '22'
  const gatewayAccountExternalId = 'a-valid-external-id'
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'

  const gatewayAccountCredentials = [{
    payment_provider: 'stripe'
  }]

  const userStubWithOpts = (roleName) => (
    {
      userExternalId: userExternalId,
      email: 'logged-in-user@example.com',
      gatewayAccountId: gatewayAccountId,
      gatewayAccountExternalId: gatewayAccountExternalId,
      role: { name: roleName }
    }
  )

  const setUpTasksWithUserRole = (roleName) => {
    cy.setEncryptedCookies(userExternalId)
    cy.task('setupStubs', [
      userStubs.getUserSuccess(userStubWithOpts(roleName)),
      gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe', gatewayAccountCredentials }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe', gatewayAccountCredentials, requiresAdditionalKycData: true }),
      transactionsSummaryStubs.getDashboardStatistics(),
      stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
        gatewayAccountId,
        responsiblePerson: true,
        bankAccount: true,
        vatNumber: true,
        companyNumber: true
      }),
      stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'stripe-account-id')
    ])
  }

  describe('Admin user', () => {
    beforeEach(() => {
      setUpTasksWithUserRole('admin')
    })
    it('should display banner', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

      cy.get('.govuk-notification-banner__heading').contains('The deadline to add more information about your organisation has passed.')
      cy.get('.govuk-notification-banner__content p:nth-of-type(2)').contains('You must update your organisation details to comply with updated Know Your Customer (KYC) anti-money laundering regulations.')
      cy.get('.govuk-notification-banner__content p:nth-of-type(3)').contains('If you do not add these details, your service will soon stop taking payments and Stripe will stop paying out to your bank account.')
      cy.get('#add-additional-kyc-details').should('exist')
      cy.get('#add-additional-kyc-details').should('have.attr', 'href', `/account/a-valid-external-id/your-psp/a-valid-external-id`)
    })
  })

  describe('View only user', () => {
    beforeEach(() => {
      setUpTasksWithUserRole('view-only')
    })
    it('should display banner', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)

      cy.get('.govuk-notification-banner__heading').contains('The deadline to add more information about your organisation has passed.')
      cy.get('.govuk-notification-banner__content p:nth-of-type(2)').contains('An admin in your organisation must update your organisation details to comply with updated Know Your Customer (KYC) anti-money laundering regulations.')
      cy.get('.govuk-notification-banner__content p:nth-of-type(3)').contains('If they do not add these details, your service will soon stop taking payments and Stripe will stop paying out to your bank account.')
      cy.get('.govuk-notification-banner__content p:nth-of-type(4)').contains('Ask an administrator to complete this now.')
      cy.get('#add-additional-kyc-details').should('not.exist')
    })
  })
})
