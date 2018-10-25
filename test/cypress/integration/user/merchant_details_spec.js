describe('Dashboard', () => {
  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookieDefaultUser'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookieDefaultUser'))
  })

  describe('Homepage', () => {
    // Use a known configuration used to generate contracts/stubs.
    // This is also used to generate the session/gateway_account cookies

    it('should have the page title \'Dashboard - System Generated test - GOV.UK Pay\'', () => {
      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')

      // Click the first organisation listed 'Organisation details' link
      cy.get('.edit-merchant-details').click()

      // Put the merchant details page in edit mode
      cy.contains('Change').click()

      // Attempt to add an invalid postcode with all other details being legitimate
      cy.get('#merchant-name').clear().type('Tom & Jerry')
      cy.get('#address-line1').clear().type('Clive House')
      cy.get('#address-line2').clear().type('10 Downing Street')
      cy.get('#address-city').clear().type('London')
      cy.get('#address-postcode').clear().type('wrongpostcode')
      cy.get('#address-country').select('GB')

      // Try and save
      cy.get('#save-merchant-details').click()

      cy.get('.govuk-error-summary__list').should('have.length', 1)
      cy.get('.govuk-error-summary__list').first()
      cy.get('.govuk-error-summary__list').first()
        .contains('Postcode')
        .should('have.attr', 'href', '#address-postcode')
      cy.get('.govuk-error-message')
        .contains('Please enter a valid postcode')
    })
  })
})
