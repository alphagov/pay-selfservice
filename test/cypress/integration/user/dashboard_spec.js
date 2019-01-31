describe('Dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'Test Service'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupStubs', [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [{
            service: {
              name: serviceName,
              gateway_account_ids: [gatewayAccountId]
            }
          }]
        }
      },
      {
        name: 'getGatewayAccountSuccess',
        opts: { gateway_account_id: gatewayAccountId }
      }
    ])
  })

  describe('Homepage', () => {
    // Note : these from/to datetime strings exactly match those in the pact/contract, so are essential to match against stubs
    // Either change everything together, or map these do a single place like a .json document so the contracts/tests refer to one place
    const from = encodeURIComponent('2018-05-14T00:00:00+01:00')
    const to = encodeURIComponent('2018-05-15T00:00:00+01:00')

    it(`should have the page title 'Dashboard - ${serviceName} test - GOV.UK Pay'`, () => {
      const dashboardUrl = `/?period=custom&fromDateTime=${from}&toDateTime=${to}`
      cy.visit(dashboardUrl)
      cy.title().should('eq', `Dashboard - ${serviceName} test - GOV.UK Pay`)
    })
  })
})
