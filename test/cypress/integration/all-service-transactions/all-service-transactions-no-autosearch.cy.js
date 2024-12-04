'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const liveTransactionsUrl = '/all-service-transactions/nosearch/live'

const gatewayAccountStripe = {
  gatewayAccountId: 42,
  gatewayAccountExternalId: 'a-valid-external-id-1',
  type: 'live',
  paymentProvider: 'stripe',
  recurringEnabled: true
}
const gatewayAccount2 = {
  gatewayAccountId: 43,
  gatewayAccountExternalId: 'a-valid-external-id-2',
  type: 'live',
  recurringEnabled: true
}
const gatewayAccount3 = {
  gatewayAccountId: 44,
  gatewayAccountExternalId: 'a-valid-external-id-3',
  type: 'test',
  recurringEnabled: true
}
const userStub = userStubs.getUserSuccessWithMultipleServices(userExternalId, [
  {
    gatewayAccountId: gatewayAccountStripe.gatewayAccountId,
    serviceName: 'Service 1'
  },
  {
    gatewayAccountIds: [gatewayAccount2.gatewayAccountId, gatewayAccount3.gatewayAccountId],
    serviceName: 'Service 2'
  }
])

const testTransactions = [
  {
    amount: 5000,
    gateway_account_id: String(gatewayAccount3.gatewayAccountId),
    reference: 'ref3',
    transaction_id: 'transaction-id-3',
    live: false,
    state: { finished: true, status: 'success' },
    refund_summary_status: 'available',
    refund_summary_available: 5000,
    refund_summary_submitted: 0
  },
  {
    gateway_account_id: String(gatewayAccount3.gatewayAccountId),
    reference: 'ref4',
    transaction_id: 'transaction-id-4',
    live: false
  }
]

describe('All service transactions without automatic search', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display All Service Transactions list page with no live transactions and ability to view test transactions', () => {
    cy.task('setupStubs', [
      userStub,
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountIds: [gatewayAccount3.gatewayAccountId],
        transactions: testTransactions
      }),
      gatewayAccountStubs.getCardTypesSuccess()
    ])

    cy.visit(liveTransactionsUrl)
    cy.title().should('eq', 'Transactions for all services')

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'LIVE')
    })

    cy.get('.transactions-list--row').should('have.length', 0)
    cy.get('#update-filters-after-timeout').should('have.text', 'Update the filters and select the Filter button.')

    cy.visit(liveTransactionsUrl)
    cy.log('Switch to view test transactions')
    cy.get('a').contains('Switch to test accounts').click()

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
    })

    cy.get('.transactions-list--row').should('have.length', 2)
    cy.get('#charge-id-transaction-id-3').should('exist')
    cy.get('#charge-id-transaction-id-4').should('exist')
  })
})
