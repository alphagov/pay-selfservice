describe('Dashboard', () => {
  const selfServiceUsers = require('../../../fixtures/config/self_service_user.json')

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
  })

  describe('Homepage', () => {
    // Use a known configuration used to generate contracts/stubs.
    // This is also used to generate the session/gateway_account cookies
    const ssUser = selfServiceUsers.config.users.filter(fil => fil.isPrimary === 'true')[0]

    it('should have the page title \'Dashboard - System Generated test - GOV.UK Pay\'', () => {
      cy.visit('/my-services')
      cy.title().should('eq', 'Choose service - GOV.UK Pay')
    })
  })
})
