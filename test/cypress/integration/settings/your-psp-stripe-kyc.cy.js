'use strict'

const userStubs = require('../../stubs/user-stubs')
const stripePspStubs = require('../../stubs/stripe-psp-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = 42
const gatewayAccountExternalId = 'a-valid-external-id'
const credentialExternalId = 'a-credential-external-id'
const serviceName = 'Purchase a positron projection permit'
const stripeAccountId = `acct_123example123`
const serviceExternalId = 'a-service-external-id'
const firstName = 'Joe'
const lastName = 'Pay'
const validUrl = 'https://www.valid-url.com'
const serviceStubs = require('../../stubs/service-stubs')

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName, serviceExternalId })

  const requiresAdditionalKycData = opts.requiresAdditionalKycData === undefined ? true : opts.requiresAdditionalKycData
  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    requiresAdditionalKycData,
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
    responsiblePerson: true,
    bankAccount: true,
    vatNumber: true,
    companyNumber: true,
    director: false,
    additionalKycData: opts.additionalKycDataCompleted || false
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
    firstName,
    lastName,
    phone: opts.phone,
    email: opts.email
  })

  const stripeUpdateAccount = stripePspStubs.updateAccount({
    stripeAccountId,
    url: validUrl
  })

  const merchantDetails = {
    url: validUrl
  }

  const servicePatch = serviceStubs.patchUpdateMerchantDetailsSuccess({
    serviceExternalId,
    gatewayAccountId,
    merchantDetails
  })

  const stubs = [user, gatewayAccountByExternalId, stripeAccountSetup, stripeAccount,
    stripeAccountDetails, stripePersons, stripeUpdateAccount, servicePatch]

  cy.task('setupStubs', stubs)
}

describe('Your PSP - Stripe - KYC', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('Task list', () => {
    it('should display link to "Information for Stripe" in the side navigation - when requires additional kyc data is enabled', () => {
      setupYourPspStubs({})
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('#navigation-menu-your-psp').should('contain', 'Information for Stripe')
    })

    it('should display organisation URL task as COMPLETED if details are updated on Stripe', () => {
      setupYourPspStubs({
        'url': 'http://example.org'
      })
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('#navigation-menu-your-psp').should('contain', 'Information for Stripe')

      cy.get('#task-organisation-url-status').should('have.html', 'completed')
    })

    it('should display all tasks as NOT STARTED if details are not updated on Stripe', () => {
      setupYourPspStubs({
        representative: true,
        phone: null,
        director: false,
        url: null
      })
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('#task-organisation-url-status').should('have.html', 'not started')
    })

    it('should display completed tasks and different content when all tasks are completed', () => {
      setupYourPspStubs({
        representative: true,
        phone: '0000000',
        email: 'test@example.org',
        director: true,
        url: 'http://example.org',
        requiresAdditionalKycData: true,
        additionalKycDataCompleted: true,
        entity_verified: true
      })
      cy.setEncryptedCookies(userExternalId)
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('#task-organisation-url-status').should('have.text', 'completed')

      cy.get('h2').contains('Know your customer (KYC) details').should('not.exist')
      cy.get('p').contains('Please review the responsible person')

      cy.get('.settings-navigation').within(() => {
        cy.get('a').contains('Information for Stripe').should('exist')
      })
    })
  })

  describe('Organisation URL Page', () => {
    beforeEach(() => {
      setupYourPspStubs()
    })

    it('should show Organisation URL page', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/kyc/${credentialExternalId}/organisation-url`)

      cy.get('h1').should('contain', 'Enter organisation website address')
    })

    it('when a valid URL is submitted, it should redirect to the Your PSP with a success banner', () => {
      cy.get('#organisation-url-form').within(() => {
        cy.get('#organisation-url').clear()
        cy.get('#organisation-url').type(validUrl)
        cy.get('button').click()
      })

      cy.get('h1').should('contain', 'Information for Stripe')
      cy.get('.govuk-notification-banner__heading').should('contain', 'Organisation website address added successfully')
    })
  })
})
