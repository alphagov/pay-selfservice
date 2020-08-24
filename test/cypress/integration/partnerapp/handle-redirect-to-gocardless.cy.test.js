const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const userStubs = require('../../stubs/user-stubs')
const goCardlessStubs = require('../../stubs/go-cardless-connect-stubs')

describe('Connect to Go Cardless', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId = 'DIRECT_DEBIT:42'

  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId, gatewayAccountId)
  })

  describe('Redirect to Go Cardless Fails', () => {
    beforeEach(() => {
      cy.task('setupStubs', [
        userStubs.getUserSuccess({ userExternalId, gatewayAccountId }),
        gatewayAccountStubs.getDirectDebitGatewayAccountSuccess({ gatewayAccountId, type: 'live', paymentProvider: 'gocardless' }),
        goCardlessStubs.redirectToGoCardlessConnectFailure()
      ])
    })

    it('should display Dashboard page with error message when redirecting to GoCardless connect fails', () => {
      cy.visit('/')
      cy.get('a[href="/link-account"').click()
      cy.visit('/link-account')
      cy.get('.govuk-error-summary')
        .should('contain', 'Something went wrong. Please try again or contact support.')
      cy.get('h1').should('contain', 'Connect to GoCardless')
      cy.get('a[href="/link-account"').should('exist')
    })
  })
})
