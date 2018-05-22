describe('Transactions', () => {
  const transactionsUrl = `/transactions`

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
  })

  describe('Transactions List', () => {
    it('should have the page title \'Transactions - System Generated test - GOV.UK Pay\'', () => {
      cy.visit(transactionsUrl)
      cy.title().should('eq', 'Transactions - System Generated test - GOV.UK Pay')
    })
  })
})
