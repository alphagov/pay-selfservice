'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')
const stripePspStubs = require('../../stubs/stripe-psp-stubs')

const gatewayAccountId = 42
const userExternalId = 'userExternalId'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const stripeAccountId = `acct_123example123`
const directorUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/director`
const directorUrlForKyc = `/account/${gatewayAccountExternalId}/kyc/${gatewayAccountCredentialExternalId}/director`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

const typedFirstName = 'Jane'
const typedLastName = ' Doe'
const typedDobDay = '25 '
const typedDobMonth = ' 02'
const typedDobYear = '1971 '
const typedEmail = 'test@example.com'

function setupStubs (director, type = 'live', paymentProvider = 'stripe', requiresAdditionalKycData = false) {
  let stripeSetupStub

  if (Array.isArray(director)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      director: director
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({
      gatewayAccountId,
      director: director
    })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId,
    credentials: { stripe_account_id: stripeAccountId }
  }]

  const stripeCreateOrUpdatePersonStub = stripePspStubs.createOrUpdatePerson({
    stripeAccountId,
    director: true
  })
  const stripeUpdateCompanyStub = stripePspStubs.updateCompany({
    stripeAccountId
  })
  const stripeListPersonsStub = stripePspStubs.listPersons({
    stripeAccountId,
    director: true
  })
  const stripeRetriveAccountStub = stripePspStubs.retrieveAccountDetails({
    stripeAccountId
  })

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
      gatewayAccountId,
      gatewayAccountExternalId: gatewayAccountExternalId,
      requiresAdditionalKycData: requiresAdditionalKycData,
      type,
      paymentProvider,
      gatewayAccountCredentials
    }),
    stripeSetupStub,
    stripeRetriveAccountStub,
    stripeCreateOrUpdatePersonStub,
    stripeListPersonsStub,
    stripeUpdateCompanyStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: director page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('when user is admin, account is Stripe and director details have not been entered', () => {
    beforeEach(() => {
      setupStubs(false)

      cy.visit(directorUrl)
    })

    it('should display form with name, dob and email fields', () => {
      cy.get('h1').should('contain', 'Enter a director’s details')

      cy.get('#director-form').should('exist')
        .within(() => {
          cy.get('label[for="first-name"]').should('exist')
          cy.get('input#first-name[name="first-name"][autocomplete="given-name"]').should('exist')

          cy.get('label[for="last-name"]').should('exist')
          cy.get('input#last-name[name="last-name"][autocomplete="family-name"]').should('exist')

          cy.get('label[for="email"]').should('exist')
          cy.get('input#email[name="email"][autocomplete="email"]').should('exist')

          cy.get('label[for="dob-day"]').should('exist')
          cy.get('input#dob-day[name="dob-day"][autocomplete="bday-day"]').should('exist')

          cy.get('label[for="dob-month"]').should('exist')
          cy.get('input#dob-month[name="dob-month"][autocomplete="bday-month"]').should('exist')

          cy.get('label[for="dob-year"]').should('exist')
          cy.get('input#dob-year[name="dob-year"][autocomplete="bday-year"]').should('exist')

          cy.get('button').should('exist')
        })
    })

    it('should show errors when validation fails', () => {
      cy.get('#director-form').within(() => {
        cy.get('#dob-day').type('29')
        cy.get('#dob-month').type('2')
        cy.get('#dob-year').type('2001')
        cy.get('#email').type('a')
        cy.get('button').click()
      })

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#first-name"]').should('contain', 'Enter a first name')
        cy.get('a[href="#last-name"]').should('contain', 'Enter a last name')
        cy.get('a[href="#dob-day"]').should('contain', 'Enter a valid date')
        cy.get('a[href="#email"]').should('contain', 'Enter a valid email address')
      })

      cy.get('#director-form').should('exist').within(() => {
        cy.get('.govuk-form-group--error > input#first-name').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
        })

        cy.get('.govuk-form-group--error > input#last-name').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
        })

        cy.get('.govuk-form-group--error > input#email').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#email').should('have.attr', 'value', 'a')
        })

        cy.get('.govuk-form-group--error > fieldset > #dob-error').parent().parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#dob-day').should('have.attr', 'value', '29')
          cy.get('input#dob-month').should('have.attr', 'value', '2')
          cy.get('input#dob-year').should('have.attr', 'value', '2001')
        })

        cy.get('button').should('exist')
      })
    })
  })

  describe('trying to save details when director already nominated', function () {
    beforeEach(() => {
      setupStubs([false, true])

      cy.visit(directorUrl)
    })

    it('should display an error instead of saving details', () => {
      cy.get('#director-form').within(() => {
        cy.get('#first-name').type(typedFirstName)
        cy.get('#last-name').type(typedLastName)
        cy.get('#dob-day').type(typedDobDay)
        cy.get('#dob-month').type(typedDobMonth)
        cy.get('#dob-year').type(typedDobYear)
        cy.get('button').click()
      })

      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#back-link').should('contain', 'Back to dashboard')
      cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
      cy.get('#error-message').should('contain', 'You’ve already provided director details.')
    })
  })

  describe('when it’s not a Stripe gateway account', () => {
    beforeEach(() => {
      setupStubs(false, 'live', 'worldpay')

      cy.visit(directorUrl, { failOnStatusCode: false })
    })

    it('should return a 404', () => {
      cy.get('h1').should('contain', 'Page not found')
    })
  })

  describe('when user has incorrect permissions', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
          gatewayAccountId,
          gatewayAccountExternalId: gatewayAccountExternalId,
          type: 'live',
          paymentProvider: 'stripe'
        }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, responsiblePerson: true })
      ])

      cy.visit(directorUrl, { failOnStatusCode: false })
    })

    it('should show a permission denied error', () => {
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'not have the administrator rights')
    })
  })

  describe('KYC - Additional data collection', () => {
    beforeEach(() => {
      setupStubs(false, 'live', 'stripe', true)

      cy.visit(directorUrlForKyc)
    })

    it('should submit director details and redirect to your-psp page', () => {
      cy.get('#director-form').within(() => {
        cy.get('#first-name').type(typedFirstName)
        cy.get('#last-name').type(typedLastName)
        cy.get('#dob-day').type(typedDobDay)
        cy.get('#dob-month').type(typedDobMonth)
        cy.get('#dob-year').type(typedDobYear)
        cy.get('#email').type(typedEmail)
        cy.get('button').click()
      })

      cy.get('h1').should('contain', 'Your payment service provider (PSP) - Stripe')
      cy.location().should((location) => {
        expect(location.pathname).to.eq(`/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}`)
      })

      cy.get('#task-add-director-status').should('have.html', 'completed')
    })
  })
})
