'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionSummaryStubs = require('../../stubs/transaction-summary-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')
const stripeAccountStubs = require('../../stubs/stripe-account-stubs')

const GATEWAY_ACCOUNT_EXTERNAL_ID = 'a-valid-external-id'

function setupStubs (userExternalId, gatewayAccountId, responsiblePerson, type = 'live', paymentProvider = 'stripe') {
  let stripeSetupStub

  if (Array.isArray(responsiblePerson)) {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupFlagForMultipleCalls({
      gatewayAccountId,
      responsiblePerson: responsiblePerson
    })
  } else {
    stripeSetupStub = stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, responsiblePerson })
  }

  cy.task('setupStubs', [
    userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
    gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId: GATEWAY_ACCOUNT_EXTERNAL_ID, type, paymentProvider }),
    stripeSetupStub,
    stripeAccountStubs.getStripeAccountSuccess(gatewayAccountId, 'acct_123example123'),
    transactionSummaryStubs.getDashboardStatistics()
  ])
}

describe('Stripe setup: responsible person page', () => {
  const gatewayAccountId = 42
  const userExternalId = 'userExternalId'

  const firstName = 'William'
  const typedFirstName = 'William '
  const typedLastName = ' Benn'
  const addressLine1 = '52 Festive Road'
  const typedAddressLine1 = ' 52 Festive Road'
  const typedAddressLine2 = 'Putney '
  const city = 'London'
  const typedCity = 'London '
  const typedPostcode = 'sw151lp '
  const typedDobDay = '25 '
  const typedDobMonth = ' 02'
  const typedDobYear = '1971 '

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('when user is admin, account is Stripe and responsible person not already nominated', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, false)

      cy.visit('/account/a-valid-external-id/responsible-person')
    })

    it('should display form', () => {
      cy.get('h1').should('contain', 'Who is your responsible person?')

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
        cy.get('button').click()
      })

      cy.get('.govuk-error-summary').should('exist').within(() => {
        cy.get('a[href="#last-name"]').should('contain', 'Last name')
        cy.get('a[href="#home-address-postcode"]').should('contain', 'Postcode')
        cy.get('a[href="#dob-day"]').should('contain', 'Date of birth')
        cy.get('a[href="#dob-month"]').should('not.exist')
        cy.get('a[href="#dob-year"]').should('not.exist')
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

        cy.get('input#first-name[name="first-name"][autocomplete="given-name"]').should('have.attr', 'value', firstName)
        cy.get('input#last-name[name="last-name"][autocomplete="family-name"]').should('exist')
        cy.get('input#home-address-line-1[name="home-address-line-1"][autocomplete="address-line1"]').should('have.attr', 'value', addressLine1)
        cy.get('input#home-address-city[name="home-address-city"][autocomplete="address-level2"]').should('have.attr', 'value', city)

        cy.get('button').should('exist')

        cy.get('input[name="answers-need-changing"]').should('not.exist')
        cy.get('input[name="answers-checked"]').should('not.exist')
      })
    })
  })

  describe('trying to view form when responsible person already nominated', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, true)

      cy.visit('/account/a-valid-external-id/responsible-person')
    })

    it('should redirect to dashboard with error message instead of showing form', () => {
      cy.get('h1').should('contain', 'Dashboard')
      cy.location().should((location) => {
        expect(location.pathname).to.eq('/')
      })
      cy.get('.flash-container .generic-error').should('contain', 'responsible person')
    })
  })

  describe('trying to save details when responsible person already nominated', function () {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, [false, true])

      cy.visit('/account/a-valid-external-id/responsible-person')
    })

    it('should redirect to dashboard with error message instead of saving details', () => {
      cy.get('#responsible-person-form').within(() => {
        cy.get('#first-name').type(typedFirstName)
        cy.get('#last-name').type(typedLastName)
        cy.get('#home-address-line-1').type(typedAddressLine1)
        cy.get('#home-address-line-2').type(typedAddressLine2)
        cy.get('#home-address-city').type(typedCity)
        cy.get('#home-address-postcode').type(typedPostcode)
        cy.get('#dob-day').type(typedDobDay)
        cy.get('#dob-month').type(typedDobMonth)
        cy.get('#dob-year').type(typedDobYear)
        cy.get('button').click()
      })

      cy.get('h1').should('contain', 'Dashboard')
      cy.location().should((location) => {
        expect(location.pathname).to.eq('/')
      })
      cy.get('.flash-container .generic-error').should('contain', 'responsible person')
    })
  })

  describe('when it’s not a Stripe gateway account', () => {
    beforeEach(() => {
      setupStubs(userExternalId, gatewayAccountId, false, 'live', 'worldpay')

      cy.visit('/account/a-valid-external-id/responsible-person', { failOnStatusCode: false })
    })

    it('should return a 404', () => {
      cy.get('h1').should('contain', 'Page not found')
    })
  })

  describe('when user has incorrect permissions', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserWithNoPermissions(userExternalId, gatewayAccountId),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({ gatewayAccountId, gatewayAccountExternalId: GATEWAY_ACCOUNT_EXTERNAL_ID, type: 'live', paymentProvider: 'stripe' }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId, responsiblePerson: true })
      ])

      cy.visit('/account/a-valid-external-id/responsible-person', { failOnStatusCode: false })
    })

    it('should show a permission denied error', () => {
      cy.get('h1').should('contain', 'An error occurred')
      cy.get('#errorMsg').should('contain', 'not have the administrator rights')
    })
  })
})
