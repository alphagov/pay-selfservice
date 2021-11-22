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
const firstName = 'Joe'
const lastName = 'Pay'

function setupYourPspStubs (opts = {}) {
  const user = userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName })

  const gatewayAccountByExternalId = gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
    gatewayAccountId,
    gatewayAccountExternalId,
    requiresAdditionalKycData: true,
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
    director: false
  })
  const stripeAccount = stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, stripeAccountId)

  const stripeAccountDetails = stripePspStubs.retrieveAccountDetails({ stripeAccountId, url: opts.url })
  const stripePersons = stripePspStubs.listPersons({
    stripeAccountId,
    representative: opts.representative,
    director: opts.director,
    firstName,
    lastName,
    phone: opts.phone,
    email: opts.email
  })

  const stubs = [user, gatewayAccountByExternalId, stripeAccountSetup, stripeAccount,
    stripeAccountDetails, stripePersons]

  cy.task('setupStubs', stubs)
}

describe('Your PSP - Stripe - KYC', () => {
  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('Task list', () => {
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

  describe('Responsible person page', () => {
    beforeEach(() => {
      setupYourPspStubs({
        representative: true
      })
    })

    it('should show the task list with the responsible person task not completed', () => {
      cy.visit(`/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)

      cy.get('#task-update-sro-status').should('have.html', 'not started')
    })

    it('should redirect to the responsible person page with existing persons name displayed', () => {
      cy.get('a').contains('Add responsible person information').click()
      cy.get('h1').should('contain', 'Enter responsible person details')
      cy.get('.govuk-back-link')
        .should('have.text', 'Back')
        .should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('td#responsible-person-name').should('contain', 'Joe Pay')
      cy.get('input[type="text"]').should('have.length', 2)
    })

    it('should display validation errors when fields are blank', () => {
      cy.get('button').contains('Submit').click()

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#telephone-number"]').should('contain', 'Work telephone number')
        cy.get('a[href="#email"]').should('contain', 'Work email address')
      })
    })

    it('should redirect to page with all fields when change is clicked', () => {
      cy.get('a').contains('Change').click()
      cy.get('input#first-name').should('exist')
      cy.get('.govuk-back-link')
        .should('have.text', 'Back')
        .should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('form').within(() => {
        cy.get('button').should('contain', 'Submit')
      })
    })

    it('should display validation errors when fields are blank', () => {
      cy.get('button').contains('Submit').click()

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#first-name"]').should('contain', 'Enter a first name')
        cy.get('a[href="#last-name"]').should('contain', 'Enter a last name')
        cy.get('a[href="#home-address-line-1"]').should('contain', 'Enter a building name, number and street')
        cy.get('a[href="#home-address-city"]').should('contain', 'Enter a town or city')
        cy.get('a[href="#home-address-postcode"]').should('contain', 'Enter a postcode')
        cy.get('a[href="#dob-day"]').should('contain', 'Enter the date of birth')
        cy.get('a[href="#telephone-number"]').should('contain', 'Enter a telephone number')
        cy.get('a[href="#email"]').should('contain', 'Enter an email address')
      })

      cy.get('.govuk-back-link')
        .should('have.text', 'Back')
        .should('have.attr', 'href', `/account/${gatewayAccountExternalId}/your-psp/${credentialExternalId}`)
      cy.get('form').within(() => {
        cy.get('button').should('contain', 'Submit')
      })
    })
  })
})
