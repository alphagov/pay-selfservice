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

const firstName = 'William'
const typedFirstName = 'William '
const addressLine1 = '52 Festive Road'
const typedAddressLine1 = ' 52 Festive Road'
const typedAddressLine2 = 'Putney '
const city = 'London'
const typedCity = 'London '

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

          cy.get('input[name="answers-need-changing"]').should('not.exist')
          cy.get('input[name="answers-checked"]').should('not.exist')
        })
    })

    it('should show errors when validation fails', () => {
      cy.get('#responsible-person-form').within(() => {
        cy.get('#first-name').type(typedFirstName)
        // No last name, which is an error
        cy.get('#home-address-line-1').type(typedAddressLine1)
        cy.get('#home-address-line-2').type(typedAddressLine2)
        cy.get('#home-address-city').type(typedCity)
        cy.get('#home-address-postcode').type('not a valid UK postcode')
        cy.get('#dob-day').type('29')
        cy.get('#dob-month').type('2')
        cy.get('#dob-year').type('2001')
        cy.get('#telephone-number').type('123')
        cy.get('#email').type('foo')
        cy.get('button').click()
      })

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#last-name"]').should('contain', 'Last name')
        cy.get('a[href="#home-address-postcode"]').should('contain', 'Postcode')
        cy.get('a[href="#dob-day"]').should('contain', 'Date of birth')
        cy.get('a[href="#dob-month"]').should('not.exist')
        cy.get('a[href="#dob-year"]').should('not.exist')
        cy.get('a[href="#telephone-number"]').should('contain', 'Work telephone number')
        cy.get('a[href="#email"]').should('contain', 'Work email address')
      })

      cy.get('#responsible-person-form').should('exist').within(() => {
        cy.get('.govuk-form-group--error > input#last-name').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#last-name[name=last-name][autocomplete=family-name]').should('exist')
        })

        cy.get('.govuk-form-group--error > input#home-address-postcode').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#home-address-postcode[name=home-address-postcode][autocomplete=postal-code]').should('have.attr', 'value', 'not a valid UK postcode')
        })

        cy.get('.govuk-form-group--error > fieldset > #dob-error').parent().parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
          cy.get('input#dob-day').should('have.attr', 'value', '29')
          cy.get('input#dob-month').should('have.attr', 'value', '2')
          cy.get('input#dob-year').should('have.attr', 'value', '2001')
        })

        cy.get('.govuk-form-group--error > input#telephone-number').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
        })

        cy.get('.govuk-form-group--error > input#email').parent().should('exist').within(() => {
          cy.get('.govuk-error-message').should('exist')
        })

        cy.get('input#first-name').should('have.attr', 'value', firstName)
        cy.get('input#last-name').should('exist')
        cy.get('input#home-address-line-1').should('have.attr', 'value', addressLine1)
        cy.get('input#home-address-city').should('have.attr', 'value', city)
        cy.get('input#telephone-number').should('have.attr', 'value', '123')
        cy.get('input#email').should('have.attr', 'value', 'foo')

        cy.get('button').should('exist')

        cy.get('input[name="answers-need-changing"]').should('not.exist')
        cy.get('input[name="answers-checked"]').should('not.exist')
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
