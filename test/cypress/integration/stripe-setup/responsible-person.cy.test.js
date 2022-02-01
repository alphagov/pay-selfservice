'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const gatewayAccountId = 42
const userExternalId = 'userExternalId'
const gatewayAccountExternalId = 'a-valid-external-id'
const gatewayAccountCredentialExternalId = 'a-valid-credential-external-id'
const responsiblePersonUrl = `/account/${gatewayAccountExternalId}/your-psp/${gatewayAccountCredentialExternalId}/responsible-person`
const dashboardUrl = `/account/${gatewayAccountExternalId}/dashboard`

function setupStubs (responsiblePerson, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(responsiblePerson)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      responsiblePerson: responsiblePerson
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, responsiblePerson })
  }

  const gatewayAccountCredentials = [{
    gateway_account_id: gatewayAccountId,
    payment_provider: paymentProvider,
    external_id: gatewayAccountCredentialExternalId
  }]

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId: gatewayAccountExternalId, type, paymentProvider, gatewayAccountCredentials }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: responsible person page', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  describe('when user is admin, account is Stripe and responsible person not already nominated', () => {
    beforeEach(() => {
      setupStubs(false)

      cy.visit(responsiblePersonUrl)
    })

    it('should display form', () => {
      cy.get('h1').should('contain', 'Enter responsible person details')

      cy.get('#responsible-person-form').should('exist')
        .within(() => {
          cy.get('label[for="first-name"]').should('exist')
          cy.get('input#first-name[name="first-name"][autocomplete="given-name"]').should('exist')

          cy.get('label[for="last-name"]').should('exist')
          cy.get('input#last-name[name="last-name"][autocomplete="family-name"]').should('exist')

          cy.get('label[for="home-address-line-1"]').should('exist')
          cy.get('input#home-address-line-1[name="home-address-line-1"][autocomplete="address-line1"]').should('exist')
          cy.get('input#home-address-line-2[name="home-address-line-2"][autocomplete="address-line2"]').should('exist')

          cy.get('label[for="home-address-city"]').should('exist')
          cy.get('input#home-address-city[name="home-address-city"][autocomplete="address-level2"]').should('exist')

          cy.get('label[for="home-address-postcode"]').should('exist')
          cy.get('input#home-address-postcode[name="home-address-postcode"][autocomplete="postal-code"]').should('exist')

          cy.get('label[for="dob-day"]').should('exist')
          cy.get('input#dob-day[name="dob-day"][autocomplete="bday-day"]').should('exist')

          cy.get('label[for="dob-month"]').should('exist')
          cy.get('input#dob-month[name="dob-month"][autocomplete="bday-month"]').should('exist')

          cy.get('label[for="dob-year"]').should('exist')
          cy.get('input#dob-year[name="dob-year"][autocomplete="bday-year"]').should('exist')

          cy.get('label[for="telephone-number"]').should('exist')
          cy.get('input#telephone-number[name="telephone-number"][autocomplete="tel"]').should('exist')

          cy.get('label[for="email"]').should('exist')
          cy.get('input#email[name="email"][autocomplete="email"]').should('exist')

          cy.get('button').should('exist')
        })
    })

    it('should show errors when validation fails', () => {
      cy.get('#responsible-person-form').within(() => {
        cy.get('#home-address-postcode').type('1')
        cy.get('#dob-day').type('a')
        cy.get('#dob-month').type('b')
        cy.get('#dob-year').type('20')
        cy.get('#telephone-number').type('123')
        cy.get('#email').type('foo')
        cy.get('button').click()
      })

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#first-name"]').should('contain', 'Enter a first name')
        cy.get('a[href="#last-name"]').should('contain', 'Enter a last name')
        cy.get('a[href="#home-address-line-1"]').should('contain', 'Enter a building name, number and street')
        cy.get('a[href="#home-address-city"]').should('contain', 'Enter a town or city')
        cy.get('a[href="#home-address-postcode"]').should('contain', 'Enter a real postcode')
        cy.get('a[href="#dob-day"]').should('contain', 'Enter a valid date')
        cy.get('a[href="#telephone-number"]').should('contain', 'Enter a telephone number')
        cy.get('a[href="#email"]').should('contain', 'Enter a valid email address')
      })

      cy.get('#responsible-person-form').should('exist').within(() => {
        cy.get('.govuk-form-group--error > input#first-name').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#first-name').should('exist')
        })
        cy.get('.govuk-form-group--error > input#last-name').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#last-name').should('exist')
        })
        cy.get('.govuk-form-group--error > input#home-address-line-1').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
        })
        cy.get('.govuk-form-group--error > input#home-address-city').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
        })
        cy.get('.govuk-form-group--error > input#home-address-postcode').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#home-address-postcode').should('have.attr', 'value', '1')
        })

        cy.get('.govuk-form-group--error > fieldset > #dob-error').parent().parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#dob-day').should('have.attr', 'value', 'a')
          cy.get('input#dob-month').should('have.attr', 'value', 'b')
          cy.get('input#dob-year').should('have.attr', 'value', '20')
        })

        cy.get('.govuk-form-group--error > input#telephone-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#telephone-number').should('have.attr', 'value', '123')
        })

        cy.get('.govuk-form-group--error > input#email').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#email').should('have.attr', 'value', 'foo')
        })

        cy.get('button').should('exist')
      })
    })
  })

  describe('trying to view form when responsible person already nominated', () => {
    beforeEach(() => {
      setupStubs(true)

      cy.visit(responsiblePersonUrl)
    })

    it('should display an error instead of showing form', () => {
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#back-link').should('contain', 'Back to dashboard')
      cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
      cy.get('#error-message').should('contain', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
    })
  })

  describe('trying to save details when responsible person already nominated', function () {
    beforeEach(() => {
      setupStubs([false, true])

      cy.visit(responsiblePersonUrl)
    })

    it('should display an error instead of saving details', () => {
      cy.get('#responsible-person-form').within(() => {
        cy.get('button').click()
      })

      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#back-link').should('contain', 'Back to dashboard')
      cy.get('#back-link').should('have.attr', 'href', dashboardUrl)
      cy.get('#error-message').should('contain', 'You’ve already nominated your responsible person. Contact GOV.UK Pay support if you need to change them.')
    })
  })

  describe('when it’s not a Stripe gateway account', () => {
    beforeEach(() => {
      setupStubs(false, 'live', 'worldpay')

      cy.visit(responsiblePersonUrl, { failOnStatusCode: false })
    })

    it('should return a 404', () => {
      cy.get('h1').should('contain', 'Page not found')
    })
  })

  describe('when user has incorrect permissions', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId: gatewayAccountExternalId, type: 'live', paymentProvider: 'stripe' }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, responsiblePerson: true })
      ])

      cy.visit(responsiblePersonUrl, { failOnStatusCode: false })
    })

    it('should show a permission denied error', () => {
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'not have the administrator rights')
    })
  })
})
