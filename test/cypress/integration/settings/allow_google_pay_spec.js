describe('Google Pay', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'My Awesome Service'
  const paymentProvider = 'worldpay'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)

    cy.task('setupStubs', [
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
          payment_provider: paymentProvider
        }, {
          gateway_account_id: gatewayAccountId,
          payment_provider: paymentProvider,
          allow_google_pay: true
        }]
      }
    ])
  })

  describe('Enable Google Pay', () => {
    it('should enable google pay', () => {
      cy.visit('/digital-wallet')
      cy.title().should('eq', `Manage digital wallet - ${serviceName} ${paymentProvider} test - GOV.UK Pay`)
      cy.get('td').contains('Google Pay').siblings().find('a').contains('Enable').click()
      cy.get('button').contains('turn on Google Pay').click()
      cy.get('#merchantId').type('111111111111111')
      cy.get('button').contains('turn on Google Pay').click()
      cy.get('.notification').should('contain', 'Google Pay successfully enabled.')
      cy.get('td').contains('Google Pay').siblings().first().should('contain', 'Yes')
      cy.get('td').contains('Google Pay').siblings().find('button').should('contain', 'Disable')
    })
  })
})
