describe('Dashboard', () => {

  const ssDefaultUser = require('../../../fixtures/config/self_service_user.json')

  beforeEach(() => {
    cy.setCookie('session', Cypress.env('encryptedSessionCookie'))
    cy.setCookie('gateway_account', Cypress.env('encryptedGatewayAccountCookie'))
  })

  describe('Homepage', () => {

    // Use a known configuration used to generate contracts/stubs.
    // This is also used to generate the session/gateway_account cookies
    const ssUser = ssDefaultUser.config.users.filter(fil => fil.isPrimary === 'true')[0]

    // Note : these from/to datetime strings exactly match those in the pact/contract, so are essential to match against stubs
    // Either change everything together, or map these do a single place like a .json document so the contracts/tests refer to one place
    const from = encodeURIComponent(ssUser.sections.dashboard.transaction_summary.from_date)
    const to = encodeURIComponent(ssUser.sections.dashboard.transaction_summary.to_date)

    it('should have the page title \'Dashboard - System Generated test - GOV.UK Pay\'', () => {
      const dashboardUrl = `/?period=custom&fromDateTime=${from}&toDateTime=${to}`
      cy.visit(dashboardUrl)
      cy.title().should('eq', 'Dashboard - System Generated test - GOV.UK Pay')
    })
  })
})
