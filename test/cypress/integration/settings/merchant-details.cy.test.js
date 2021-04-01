const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')

describe('Dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)

    cy.task('setupStubs', [
      userStubs.getUserSuccess({ userExternalId, gatewayAccountId, serviceName: 'service-name' }),
      gatewayAccountStubs.getGatewayAccountsSuccess({ gatewayAccountId, paymentProvider: 'sandbox', type: 'test' })
    ])
  })

  describe('Homepage', () => {
    it('should have the page title \'Choose service - GOV.UK Pay\'', () => {
      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')

      // Click the first organisation listed 'Organisation details' link
      cy.get('.edit-merchant-details').click()

      // Attempt to add an invalid postcode with all other details being legitimate
      cy.get('#merchant-name').type('Tom & Jerry')
      cy.get('#telephone-number').type('0113 496 0000')
      cy.get('#address-line1').type('Clive House')
      cy.get('#address-line2').type('10 Downing Street')
      cy.get('#address-city').type('London')
      cy.get('#address-postcode').type('wrongpostcode')
      cy.get('#address-country').select('GB')

      // Try and save
      cy.get('#save-merchant-details').click()

      cy.get('.govuk-error-summary__list').should('have.length', 1)
      cy.get('.govuk-error-summary__list').first()
      cy.get('.govuk-error-summary__list').first()
        .contains('Postcode')
        .should('have.attr', 'href', '#address-postcode')
      cy.get('.govuk-error-message')
        .contains('Please enter a real postcode')
    })
  })
})
