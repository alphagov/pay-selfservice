describe('Apple Pay', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'My Awesome Service'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupGetUserAndGatewayAccountStubs', [
      {
        name: 'getUserSuccess',
        opts: {
          external_id: userExternalId,
          service_roles: [{
            service: {
              gateway_account_ids: [gatewayAccountId],
              name: serviceName
            }
          }]
        }
      },
      {
        name: 'getGatewayAccountSuccessRepeatNTimes',
        opts: [{
          gateway_account_id: gatewayAccountId,
          payment_provider: 'worldpay'
        }, {
          gateway_account_id: gatewayAccountId,
          payment_provider: 'worldpay',
          allow_apple_pay: true
        }]
      }
    ])
  })

  describe('Enable Apple Pay', () => {
    it('should enable apple pay', () => {
      cy.visit('/digital-wallet')
      cy.title().should('eq', `Manage digital wallet - ${serviceName} worldpay test - GOV.UK Pay`)
      cy.get('td').contains('Apple Pay').siblings().find('a').contains('Enable').click()
      cy.get('button').contains('turn on Apple Pay').click()
      cy.get('.notification').should('contain', 'Apple Pay successfully enabled.')
      cy.get('td').contains('Apple Pay').siblings().first().should('contain', 'Yes')
      cy.get('td').contains('Apple Pay').siblings().get('button').should('contain', 'Disable')
    })
  })
})
