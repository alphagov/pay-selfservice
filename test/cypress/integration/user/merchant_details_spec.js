describe('Dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 666

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupStubs', [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [{
            service: {
              gateway_account_ids: [gatewayAccountId]
            }
          }]
        }
      },
      {
        name: 'getGatewayAccountQueryParamsSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      }
    ])
  })

  describe('Homepage', () => {
    // Use a known configuration used to generate contracts/stubs.
    // This is also used to generate the session/gateway_account cookies

    it('should have the page title \'Choose service - GOV.UK Pay\'', () => {
      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')

      // Click the first organisation listed 'Organisation details' link
      cy.get('.edit-merchant-details').click()

      // Attempt to add an invalid postcode with all other details being legitimate
      cy.get('#merchant-name').type('Tom & Jerry')
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
        .contains('Please enter a valid postcode')
    })
  })
})
