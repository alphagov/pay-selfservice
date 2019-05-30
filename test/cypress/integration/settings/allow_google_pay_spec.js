describe('Google Pay', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 42
  const serviceName = 'My Awesome Service'
  const paymentProvider = 'worldpay'

  beforeEach(() => {
    Cypress.Cookies.preserveOnce('session', 'gateway_account')
  })

  describe('is disabled', () => {
    beforeEach(() => {
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
          name: 'getGatewayAccountSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            payment_provider: 'worldpay',
            allow_google_pay: false
          }
        }
      ])
    })

    it('should show it is disabled', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId)
      cy.visit('/digital-wallet')
      cy.title().should('eq', `Manage digital wallet - ${serviceName} ${paymentProvider} test - GOV.UK Pay`)
      cy.get('td').contains('Google Pay').siblings().find('a').contains('Change').click()
      cy.get('input[type="radio"]').should('have.length', 2)
      cy.get('input[value="on"]').should('not.be.checked')
      cy.get('input[value="off"]').should('be.checked')
    })
  })

  describe('but allow us to enable', () => {
    beforeEach(() => {
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
          name: 'getGatewayAccountSuccess',
          opts: {
            gateway_account_id: gatewayAccountId,
            payment_provider: 'worldpay',
            allow_google_pay: true
          }
        }
      ])
    })

    it('should allow us to enable', () => {
      cy.get('input[value="on"]').click()
      cy.get('input[value="on"]').should('be.checked')
      cy.get('#merchantId').type('111111111111111')
      cy.get('.govuk-button').contains('turn on Google Pay').click()
      cy.get('.notification').should('contain', 'Google Pay successfully enabled.')
      cy.get('input[value="on"]').should('be.checked')
    })
  })
})
