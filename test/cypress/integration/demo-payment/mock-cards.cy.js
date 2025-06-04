const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')
const GatewayAccountType = require('@models/gateway-account/gateway-account-type')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const gatewayAccountId = '42'
const gatewayAccountExternalId = 'a-valid-external-id'
const serviceExternalId = 'service123abc'

describe('Show Mock cards screen', () => {
  beforeEach(() => {
    cy.task('setupStubs', [
      userStubs.getUserSuccess({ gatewayAccountId, userExternalId, serviceExternalId }),

      gatewayAccountStubs.getAccountByServiceIdAndAccountType(serviceExternalId, GatewayAccountType.TEST, {
        gateway_account_id: gatewayAccountId,
        payment_provider: 'sandbox'
      }),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
        gatewayAccountId,
        gatewayAccountExternalId,
        paymentProvider: 'sandbox'
      }),

      transactionStubs.getTransactionsSummarySuccess()
    ])
  })

  it('should load the mock cards page and show non stripe card', () => {
    cy.setEncryptedCookies(userExternalId)
    cy.visit(`/service/${serviceExternalId}/account/${GatewayAccountType.TEST}/dashboard`)
    cy.get('a').contains('Make a demo payment').click()
    cy.get('h1').should('have.text', 'Make a demo payment')

    cy.get('#payment-description').contains('An example payment description')
    cy.get('#payment-amount').contains('£20.00')

    cy.log('Continue to Mock Cards page')
    cy.get('a').contains('Continue').click()
    cy.get('h1').should('have.text', 'Mock card numbers')
    cy.get('p').contains(/^4000056655665556/)
  })
})
