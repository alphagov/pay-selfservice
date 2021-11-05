'use strict'

const userStubs = require('../../stubs/user-stubs')
const stripePspStubs = require('../../stubs/stripe-psp-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Your PSP - Stripe - KYC', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const gatewayAccountExternalId = 'a-valid-external-id'
  const credentialExternalId = 'a-credential-external-id'
  const serviceName = 'Purchase a positron projection permit'
  const stripeAccountId = `acct_123example123`

  function setupYourPspStubs (opts = {}) {
    let user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })

    const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId,
      requiresAdditionalKycData: true,
      gatewayAccountCredentials: [{
        payment_provider: 'stripe',
        credentials: { stripe_account_id: stripeAccountId },
        external_id: credentialExternalId
      }]
    })

    const stripeAccountDetails = stripePspStubs.retrieveAccountDetails({ stripeAccountId, url: opts.url })
    const stripePersons = stripePspStubs.listPersons({
      stripeAccountId,
      representative: opts.representative,
      director: opts.director,
      phone: opts.phone,
      email: opts.email
    })

    const stubs = [user, gatewayAccountByExternalId,
      stripeAccountDetails, stripePersons]

    cy.task('setupStubs', stubs)
  }

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  it('should display link to "Your PSP - Stripe" in the side navigation - when requires additional kyc data is enabled', () => {
    setupYourPspStubs({})
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Stripe')
  })

  it('should display responsible person task as COMPLETED if details are updated on Stripe', () => {
    setupYourPspStubs({
      representative: true,
      phone: '0000000',
      email: 'test@example.org'
    })
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Stripe')

    cy.get('#task-update-sro-status').should('have.html', 'completed')
  })
  it('should display director task as COMPLETED if details are updated on Stripe', () => {
    setupYourPspStubs({
      director: true
    })
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Stripe')

    cy.get('#task-add-director-status').should('have.html', 'completed')
  })
  it('should display organisation URL task as COMPLETED if details are updated on Stripe', () => {
    setupYourPspStubs({
      'url': 'http://example.org'
    })
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('#navigation-menu-your-psp').should('contain', 'Your PSP - Stripe')

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
    cy.get('#task-update-sro-status').should('have.html', 'not started')
    cy.get('#task-add-director-status').should('have.html', 'not started')
    cy.get('#task-organisation-url-status').should('have.html', 'not started')
  })

  it('should not display tasks if all tasks are COMPLETED', () => {
    setupYourPspStubs({
      representative: true,
      phone: '0000000',
      email: 'test@example.org',
      director: true,
      url: 'http://example.org'
    })
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
    cy.get('#task-update-sro-status').should('not.exist')
    cy.get('#task-add-director-status').should('not.exist')
    cy.get('#task-organisation-url-status').should('not.exist')
  })
})
