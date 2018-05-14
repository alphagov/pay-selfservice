describe('Login Page', () => {
  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
  })

  describe('TEST: Logged in homepage', () => {
    it('should have the page title \'Sign in to GOV.UK Pay\'', () => {
      cy.visit('/')
      cy.title().should('eq', 'Dashboard - System Generated')
    })
  })
})
