describe('Dashboard', () => {

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookiePlatformAdmin'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookiePlatformAdmin'))
  })

  describe('Homepage', () => {
    it('should have the page title \'Dashboard - System Generated test - GOV.UK Pay\'', () => {
      cy.visit('/')
      cy.title().should('eq', 'Dashboard - System Generated test - GOV.UK Pay')
    })
  })
})
