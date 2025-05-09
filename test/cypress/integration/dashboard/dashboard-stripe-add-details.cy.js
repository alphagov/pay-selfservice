'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')
const stripeAccountId = 'stripe-account-id'
const stripePspStubs = require('../../stubs/stripe-psp-stubs')
const { STRIPE } = require('@models/constants/payment-providers')

const gatewayAccountId = '22'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountType = 'live'
const serviceExternalId = 'service123abc'
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountCredentials = [{ payment_provider: 'stripe' }]

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({
    userExternalId,
    gatewayAccountId,
    gatewayAccountExternalId,
    serviceExternalId,
    features: opts.userFeatures || ''
  })
  const stripeAccount = stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'stripe-account-id')
  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess(
    { gatewayAccountId, gatewayAccountExternalId, type: gatewayAccountType, paymentProvider: STRIPE, gatewayAccountCredentials })
  const gatewayAccounts = gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId })
  const transactionsSummary = transactionsSummaryStubs.getDashboardStatistics()
  const gatewayAccountSuccess = gatewayAccountStubs.getGatewayAccountSuccess(
    { gatewayAccountId, type: gatewayAccountType, paymentProvider: 'stripe', gatewayAccountCredentials })
  const stripeAccountSetup = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
    gatewayAccountId,
    bankAccount: opts.bankAccount || false,
    director: opts.director || false,
    vatNumber: opts.vatNumber || false,
    companyNumber: opts.companyNumber || false,
    responsiblePerson: opts.responsiblePerson || false,
    organisationDetails: opts.organisationDetails || false,
    governmentEntityDocument: opts.governmentEntityDocument || false
  })

  const stripeRestrictedAccountDetails = stripePspStubs.retrieveAccountDetails({
    stripeAccountId,
    charges_enabled: opts.charges_enabled,
    current_deadline: opts.current_deadline
  })

  const stubs = [user, stripeAccount, gatewayAccountByExternalId, transactionsSummary, gatewayAccountSuccess,
    stripeAccountSetup, stripeRestrictedAccountDetails, gatewayAccounts,
    stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
      serviceExternalId,
      accountType: gatewayAccountType
    }),
    gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, gatewayAccountType, {
      gateway_account_id: gatewayAccountId,
      type: gatewayAccountType,
      payment_provider: STRIPE
    })]
  cy.task('setupStubs', stubs)
}

describe('The Stripe psp details banner', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('call to action banner should link to payment provider stripe details', () => {
    setupYourPspStubs({
    })

    cy.visit(`/account/${gatewayAccountExternalId}/dashboard`)
    cy.get('.govuk-notification-banner__title').contains('Important')
    cy.get('.govuk-notification-banner__content')
      .contains('Finish setting up your service to start taking payments')
      .parent()
      .contains('You\'ve started to set up your live account. There are still some steps you need to complete.')
      .within(() => {
        cy.get('a')
          .should('have.attr', 'href', '/service/service123abc/account/live/settings/stripe-details')
          .click()
      })
    cy.get('h1').contains('Stripe details')
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
    cy.get('.govuk-notification-banner__title').contains('Important')
    cy.get('.govuk-notification-banner__content')
      .contains('Stripe has restricted your account')
      .parent()
      .contains('To start taking payments again, please contact support govuk-pay-support@digital.cabinet-office.gov.uk')
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
    cy.get('.govuk-notification-banner').should('not.exist')
  })
})
