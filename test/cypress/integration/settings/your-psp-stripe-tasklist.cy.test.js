'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e' // pragma: allowlist secret
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const credentialExternalId = 'a-credential-external-id'
const stripeAccountId = `acct_123example123`
const serviceName = 'Purchase a positron projection permit'

function setupYourPspStubs () {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })

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
    gatewayAccountId
  })

  const stubs = [user, gatewayAccountByExternalId, stripeAccountSetup]

  cy.task('setupStubs', stubs)
}

describe('Your PSP Stripe page', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })
  it('should contain Your PSP - Stripe heading', () => {
    setupYourPspStubs({})
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('.govuk-heading-m').should('contain', 'Information for Stripe')
  })
  it('should display all the required stripe tasks ', () => {
    setupYourPspStubs({})
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
  
    cy.get('span').contains('Bank Details').should('exist')
    cy.get('span').contains('Responsible person').should('exist')
    cy.get('span').contains('Service director').should('exist')
    cy.get('span').contains('VAT registration number').should('exist')
    cy.get('span').contains('Company registration number').should('exist')
    cy.get('span').contains('Confirm your organisation’s name and address match your government entity document').should('exist')
    cy.get('span').contains('Government entity document').should('exist')
  })
  
  it('should autamatically show government document as cannot start yet and the rest of the tasks as not started', () => {
    setupYourPspStubs({})
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    
    cy.get('strong[id="task-bank-details-status"]').should('contain', 'not started')
    cy.get('strong[id="task-sro-status"]').should('contain', 'not started')
    cy.get('strong[id="task-director-status"]').should('contain', 'not started')
    cy.get('strong[id="task-vatNumber-status"]').should('contain', 'not started')
    cy.get('strong[id="task-Company-number-status"]').should('contain', 'not started')
    cy.get('strong[id="task-checkorganisation-details-status"]').should('contain', 'not started')
    cy.get('strong[id="task-government-entity-document-status"]').should('contain', 'cannot start yet')
  })
})
