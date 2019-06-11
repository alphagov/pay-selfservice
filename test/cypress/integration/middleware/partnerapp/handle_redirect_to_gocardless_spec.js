describe('Dashboard', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 'DIRECT_DEBIT:42'
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
        name: 'getDirectDebitGatewayAccountSuccess',
        opts: {
          gateway_account_id: gatewayAccountId,
          payment_provider: 'gocardless',
          is_connected: false,
          type: 'test'
        }
      },
      {
        name: 'redirectToGoCardlessConnectFailure'
      }
    ])
  })

  describe('Linking GoCardless account', () => {
    it(`should display Dashboard page with error message when redirecting to GoCardless connect fails`, () => {
      cy.visit('/')
      cy.get('a[href="/link-account"').click()
      cy.visit('/link-account')
      cy.get('.notification').should('have.class', 'generic-error')
      cy.get('h2').should('contain', 'There is a problem, please retry again')
      cy.get('h1').should('contain', 'Connect to GoCardless')
      cy.get('a[href="/link-account"').should('exist')
    })
  })
})
