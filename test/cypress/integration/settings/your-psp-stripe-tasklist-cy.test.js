'use strict'

const userStubs = require('../../stubs/user-stubs')
const stripePspStubs = require('../../stubs/stripe-psp-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const credentialExternalId = 'a-credential-external-id'
const stripeAccountId = `acct_123example123`

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId })

  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    requiresAdditionalKycData: false,
    type: 'live',
    paymentProvider: 'stripe',
    gatewayAccountCredentials: [{
      payment_provider: 'stripe',
      credentials: { stripe_account_id: stripeAccountId },
      external_id: credentialExternalId
    }]
  })
  const stripeAccountSetup = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
    gatewayAccountId,
    responsiblePerson: false,
    bankAccount: false,
    vatNumber: false,
    companyNumber: false,
    director: false
  })
  const stripeAccount = stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, stripeAccountId)

  const stripeAccountDetails = stripePspStubs.retrieveAccountDetails({
    stripeAccountId,
    url: opts.url,
    entity_verified: opts.entity_verified
  })

  const stripePersons = stripePspStubs.listPersons({
    stripeAccountId,
    representative: opts.representative,
    director: opts.director,
    firstName: opts.name,
    lastName: opts.lastName,
    phone: opts.phone,
    email: opts.email
  })

  const stubs = [user, gatewayAccountByExternalId, stripeAccountSetup, stripeAccount, stripePersons, stripeAccountDetails]

  cy.task('setupStubs', stubs)
}

describe('Your PSP Stripe page', () => {
    beforeEach(() => {  
  Cypress.Cookies.preserveOnce('session', 'gateway_account')
    })
  it('should display link to "Your PSP - Stripe" and display ENABLE_STRIPE_ONBOARDING_TASK_LIST flag enabled', () => {
    setupYourPspStubs({})
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('.govuk-heading-m').should('contain', 'ENABLE_STRIPE_ONBOARDING_TASK_LIST flag is enabled')
  })
})
  