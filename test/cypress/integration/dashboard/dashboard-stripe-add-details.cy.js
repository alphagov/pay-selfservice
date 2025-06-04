const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionsSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripePspStubs = require('../../stubs/stripe-psp-stubs')
const { STRIPE } = require('@models/constants/payment-providers')
const CredentialState = require('@models/constants/credential-state')

const stripeAccountId = 'acct_blahblahblah'
const gatewayAccountId = '22'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountType = 'live'
const serviceExternalId = 'service123abc'
const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'


function setupYourPspStubs(opts = {}) {
  const user = userStubs.getUserSuccess({
    userExternalId,
    gatewayAccountId,
    gatewayAccountExternalId,
    serviceExternalId,
    features: opts.userFeatures || '',
  })

  const gatewayAccountCredentials = [
    {
      payment_provider: 'stripe',
      state: opts.credentialState ?? CredentialState.CREATED,
      credentials: {
        stripe_account_id: stripeAccountId,
      }
    },
  ]

  const gatewayAccountByServiceExternalIdAndAccountType = gatewayAccountStubs.getAccountByServiceIdAndAccountType(
    serviceExternalId,
    gatewayAccountType,
    {
      gateway_account_id: gatewayAccountId,
      type: gatewayAccountType,
      payment_provider: STRIPE,
      external_id: gatewayAccountExternalId,
      gateway_account_credentials: gatewayAccountCredentials,
    }
  )
  const transactionsSummary = transactionsSummaryStubs.getDashboardStatistics()
  const stripeRestrictedAccountDetails = stripePspStubs.retrieveAccountDetails({
    stripeAccountId,
    charges_enabled: opts.chargesEnabled ?? false
  })

  const stubs = [
    user,
    gatewayAccountByServiceExternalIdAndAccountType,
    transactionsSummary,
    stripeRestrictedAccountDetails,
    stripeAccountSetupStubs.getStripeSetupProgressByServiceExternalIdAndAccountType({
      serviceExternalId,
      accountType: gatewayAccountType,
      bankAccount: opts.bankAccount ?? true,
      director: opts.director ?? true,
      vatNumber: opts.vatNumber ?? true,
      companyNumber: opts.companyNumber ?? true,
      responsiblePerson: opts.responsiblePerson ?? true,
      organisationDetails: opts.organisationDetails ?? true,
      governmentEntityDocument: opts.governmentEntityDocument ?? true
    })
  ]
  cy.task('setupStubs', stubs)
}

describe('The Stripe psp details banner', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('call to action banner should link to payment provider stripe details', () => {
    setupYourPspStubs({
      responsiblePerson: false,
      bankAccount: false,
      vatNumber: false,
      companyNumber: false,
      director: false,
      organisationDetails: false,
      governmentEntityDocument: false,
    })

    cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)
    cy.get('.govuk-notification-banner__title').contains('Important')
    cy.get('.govuk-notification-banner__content')
      .contains('Finish setting up your service to start taking payments')
      .parent()
      .contains("You've started to set up your live account. There are still some steps you need to complete.")
      .within(() => {
        cy.get('a').should('have.attr', 'href', '/service/service123abc/account/live/settings/stripe-details').click()
      })
    cy.get('h1').contains('Stripe details')
  })

  it('should display restricted banner when account is fully setup but the Stripe account is restricted ', () => {
    setupYourPspStubs({
      chargesEnabled: false,
    })

    cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)
    cy.get('.govuk-notification-banner__title').contains('Important')
    cy.get('.govuk-notification-banner__content')
      .contains('Stripe has restricted your account')
      .parent()
      .contains(
        'To start taking payments again, please contact support'
      )
      .within(() => {
        cy.get('a').should('have.attr', 'href', 'mailto:govuk-pay-support@digital.cabinet-office.gov.uk')
      })
  })

  it('should display no banner when the account is not restricted and all tasks are complete ', () => {
    setupYourPspStubs({
      chargesEnabled: true,
      credentialState: CredentialState.ACTIVE
    })

    cy.visit(`/service/${serviceExternalId}/account/${gatewayAccountType}/dashboard`)
    cy.get('.govuk-notification-banner').should('not.exist')
  })
})
