'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')
const stripeAccountId = 'stripe-account-id'
const stripePspStubs = require('../../stubs/stripe-psp-stubs')

const gatewayAccountId = '22'
const gatewayAccountExternalId = 'a-valid-external-id'
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountCredentials = [{ payment_provider: 'stripe' }]

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, gatewayAccountExternalId })

  const stripeAccount = stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'stripe-account-id')
  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe', gatewayAccountCredentials })
  const transactionsSummary = transactionsSummaryStubs.getDashboardStatistics()
  const gatewayAccountSucess = gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'stripe', gatewayAccountCredentials })
  const stripeAccountSetup = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
    gatewayAccountId,
    bankAccount: opts.bankAccount,
    director: opts.director,
    vatNumber: opts.vatNumber,
    companyNumber: opts.companyNumber,
    responsiblePerson: opts.responsiblePerson,
    organisationDetails: opts.organisationDetails,
    governmentEntityDocument: opts.governmentEntityDocument
  })

  const stripeRestrictedAccountDetails = stripePspStubs.retrieveAccountDetails({
    stripeAccountId,
    charges_enabled: opts.charges_enabled,
    current_deadline: opts.current_deadline
  })

  const stubs = [user, stripeAccount, gatewayAccountByExternalId, transactionsSummary, gatewayAccountSucess, stripeAccountSetup, stripeRestrictedAccountDetails]
  cy.task('setupStubs', stubs)
}

describe('The Stripe psp details banner', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display call to action banner when all the tasks are not complete ', () => {
    setupYourPspStubs({
      bankAccount: false,
      director: false,
      vatNumber: false,
      companyNumber: false,
      responsiblePerson: false,
      organisationDetails: false,
      governmentEntityDocument: false
    })

    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
    cy.percySnapshot()
    cy.get('[data-cy=stripe-notification]')
      .contains('You need to submit additional information to Stripe to be able to take payments.')
      .within(() => {
      cy.get('a').should('have.attr', 'href', '/account/a-valid-external-id/your-psp/a-valid-external-id')
      })
  })

  it('should display restricted banner when account is fully setup but the Stripe account is restricted ', () => {
    setupYourPspStubs({
      charges_enabled: false,
      responsiblePerson: true,
      bankAccount: true,
      vatNumber: true,
      companyNumber: true,
      director: true,
      organisationDetails: true,
      governmentEntityDocument: true
    })

    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
    cy.percySnapshot()
    cy.get('[data-cy=stripe-notification]')
      .contains('Stripe has restricted your account. To start taking payments again, please contact support govuk-pay-support@digital.cabinet-office.gov.uk')
      .within(() => {
      cy.get('a').should('have.attr', 'href', 'mailto:govuk-pay-support@digital.cabinet-office.gov.uk')
      })
  })

  it('should display no banner when the account is not restricted and all tasks are complete ', () => {
    setupYourPspStubs({
      charges_enabled: true,
      responsiblePerson: true,
      bankAccount: true,
      vatNumber: true,
      companyNumber: true,
      director: true,
      organisationDetails: true,
      governmentEntityDocument: true
    })

    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
    cy.percySnapshot()
    cy.get('[data-cy=stripe-notification]').should('not.exist')
  })
})
