'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
const transactionsUrl = `/all-service-transactions`

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

const liveTransactions = [
  {
    gateway_account_id: String(gatewayAccountStripe.gatewayAccountId),
    reference: 'ref1',
    transaction_id: 'transaction-id-1',
    live: true
  },
  {
    gateway_account_id: String(gatewayAccount2.gatewayAccountId),
    reference: 'ref2',
    transaction_id: 'transaction-id-2',
    live: true
  }
]

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

describe('All service transactions', () => {
  beforeEach(() => {
    cy.setEncryptedCookies(userExternalId)
  })

  it('should display All Service Transactions list page with live transactions and ability to view test transactions', () => {
    cy.task('setupStubs', [
      userStub,
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountIds: [gatewayAccountStripe.gatewayAccountId, gatewayAccount2.gatewayAccountId],
        transactions: liveTransactions
      }),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountIds: [gatewayAccount3.gatewayAccountId],
        transactions: testTransactions
      }),
      gatewayAccountStubs.getCardTypesSuccess()
    ])

    cy.visit(transactionsUrl)
    cy.title().should('eq', `Transactions for all services`)

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'LIVE')
    })

    cy.get('.transactions-list--row').should('have.length', 2)
    cy.get('#charge-id-transaction-id-1').should('exist').should('have.attr', 'href', `/redirect/transactions/transaction-id-1`)
    cy.get('#charge-id-transaction-id-2').should('exist').should('have.attr', 'href', `/redirect/transactions/transaction-id-2`)

    cy.visit(transactionsUrl)
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

  it('should have links back to all service transactions when navigating to transaction detail page', () => {
    cy.task('setupStubs', [
      userStub,
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountIds: [gatewayAccount3.gatewayAccountId],
        transactions: testTransactions
      }),
      transactionStubs.getLedgerTransactionsSuccess({
        gatewayAccountIds: [gatewayAccount3.gatewayAccountId],
        transactions: [testTransactions[0]],
        filters: {
          reference: 'ref3'
        }
      }),
      gatewayAccountStubs.getCardTypesSuccess(),
      transactionStubs.getLedgerTransactionSuccess({ transactionDetails: testTransactions[0] }),
      gatewayAccountStubs.getGatewayAccountSuccess(gatewayAccount3),
      gatewayAccountStubs.getGatewayAccountByExternalIdSuccess(gatewayAccount3),
      transactionStubs.getLedgerEventsSuccess({ transactionId: 'transaction-id-3' })
    ])

    cy.visit('/all-service-transactions/test')
    // Add some filters, so we can check the back links will include them
    cy.get('#reference').type('ref3')
    cy.get('#filter').click()
    cy.get('.transactions-list--row').should('have.length', 1)
    cy.get('#charge-id-transaction-id-3').should('exist')

    cy.get('#charge-id-transaction-id-3').click()

    cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('contain',
      'Service 2')
    cy.get('.transaction-details tbody').find('tr').eq(1).find('td').first().should('contain',
      'ref3')

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
    })

    cy.get('.govuk-back-link')
      .should('have.text', 'Back to transactions for all services')
      .should('have.attr', 'href', '/all-service-transactions/test?reference=ref3&email=&cardholderName=&lastDigitsCardNumber=&fromDate=&fromTime=&toDate=&toTime=&metadataValue=&agreementId=')

    cy.get('a.refund__toggle').click()
    cy.get('button').contains('Confirm refund').click()

    cy.get('.govuk-breadcrumbs').within(() => {
      cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
      cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
      cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
    })

    cy.get('.govuk-back-link')
      .should('have.text', 'Back to transactions for all services')
      .should('have.attr', 'href', '/all-service-transactions/test?reference=ref3&email=&cardholderName=&lastDigitsCardNumber=&fromDate=&fromTime=&toDate=&toTime=&metadataValue=&agreementId=')
  })

  it('should redirect from /all-services-transactions/live to failure page when ledger returns 504 and allow user to navigate to no autosearch transactions page', () => {
    cy.task('setupStubs', [
      userStub,
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),

      transactionStubs.getLedgerTransactionsFailure({
        account_id: `${gatewayAccountStripe.gatewayAccountId},${gatewayAccount2.gatewayAccountId}`,
        page: 1,
        display_size: 100,
        limit_total: true,
        limit_total_size: 5001
      }, 504),
      gatewayAccountStubs.getCardTypesSuccess()
    ])

    cy.visit('/all-service-transactions/live', { failOnStatusCode: false })

    cy.get('.govuk-heading-l').should('have.text', "An error occurred")
    cy.get('#errorMsg').should('have.text', "The search has timed out. Try searching for a specific date range or applying other filters.")

    cy.get('.govuk-body').get('a').contains('Back to transactions search').click()

    cy.location('pathname').should('eq', '/all-service-transactions/nosearch/live')
  })

  it('should redirect from /all-services-transactions/test to failure page when ledger returns 504 and allow user to navigate to no autosearch transactions page', () => {
    cy.task('setupStubs', [
      userStub,
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),

      transactionStubs.getLedgerTransactionsFailure({
        account_id: `${gatewayAccount3.gatewayAccountId}`,
        page: 1,
        display_size: 100,
        limit_total: true,
        limit_total_size: 5001
      }, 504),
      gatewayAccountStubs.getCardTypesSuccess()
    ])

    cy.visit('/all-service-transactions/test', { failOnStatusCode: false })

    cy.get('.govuk-heading-l').should('have.text', "An error occurred")
    cy.get('#errorMsg').should('have.text', "The search has timed out. Try searching for a specific date range or applying other filters.")

    cy.get('.govuk-body').get('a').contains('Back to transactions search').click()

    cy.location('pathname').should('eq', '/all-service-transactions/nosearch/test')
  })

  it('should redirect from /all-services-transactions to failure page when ledger returns 504 and allow user to navigate to no autosearch transactions page', () => {
    cy.task('setupStubs', [
      userStub,
      gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),

      transactionStubs.getLedgerTransactionsFailure({
        account_id: `${gatewayAccountStripe.gatewayAccountId},${gatewayAccount2.gatewayAccountId}`,
        page: 1,
        display_size: 100,
        limit_total: true,
        limit_total_size: 5001
      }, 504),
      gatewayAccountStubs.getCardTypesSuccess()
    ])

    cy.visit('/all-service-transactions', { failOnStatusCode: false })

    cy.get('.govuk-heading-l').should('have.text', "An error occurred")
    cy.get('#errorMsg').should('have.text', "The search has timed out. Try searching for a specific date range or applying other filters.")

    cy.get('.govuk-body').get('a').contains('Back to transactions search').click()

    cy.location('pathname').should('eq', '/all-service-transactions/nosearch/live')
  })

})
