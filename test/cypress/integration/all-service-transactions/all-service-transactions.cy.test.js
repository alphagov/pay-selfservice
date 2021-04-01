'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

describe('All service transactions', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const transactionsUrl = `/all-service-transactions`

  const gatewayAccount1 = {
    gatewayAccountId: 42,
    gatewayAccountExternalId: 'a-valid-external-id-1',
    type: 'live',
    paymentProvider: 'stripe'
  }
  const gatewayAccount2 = {
    gatewayAccountId: 43,
    gatewayAccountExternalId: 'a-valid-external-id-2',
    type: 'live'
  }
  const gatewayAccount3 = {
    gatewayAccountId: 44,
    gatewayAccountExternalId: 'a-valid-external-id-3',
    type: 'test'
  }
  const userStub = userStubs.getUserSuccessWithMultipleServices(userExternalId, [
    {
      gatewayAccountId: gatewayAccount1.gatewayAccountId,
      serviceName: 'Service 1'
    },
    {
      gatewayAccountIds: [gatewayAccount2.gatewayAccountId, gatewayAccount3.gatewayAccountId],
      serviceName: 'Service 2'
    }
  ])

  const liveTransactions = [
    {
      gateway_account_id: String(gatewayAccount1.gatewayAccountId),
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

  describe('Visiting All Service Transactions', () => {
    beforeEach(() => {
      Cypress.Cookies.preserveOnce('session', 'gateway_account')
    })

    it('should display All Service Transactions list page with live transactions', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStub,
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccount1, gatewayAccount2, gatewayAccount3]),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccount1.gatewayAccountId, gatewayAccount2.gatewayAccountId],
          transactions: liveTransactions
        }),
        gatewayAccountStubs.getCardTypesSuccess()
      ])

      cy.visit(transactionsUrl)
      cy.title().should('eq', `Transactions for all services`)
      cy.get('.transactions-list--row').should('have.length', 2)
      cy.get('#charge-id-transaction-id-1').should('exist')
      cy.get('#charge-id-transaction-id-2').should('exist')
    })

    it('should have correct breadcrumb navigation', () => {
      cy.get('.govuk-breadcrumbs').within(() => {
        cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
        cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
        cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'LIVE')
      })
    })

    it('should show test transactions when Swtich to test accounts link clicked', () => {
      cy.task('setupStubs', [
        userStub,
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccount1, gatewayAccount2, gatewayAccount3]),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccount3.gatewayAccountId],
          transactions: testTransactions
        }),
        gatewayAccountStubs.getCardTypesSuccess()
      ])

      cy.get('a').contains('Switch to test accounts').click()

      cy.get('.transactions-list--row').should('have.length', 2)
      cy.get('#charge-id-transaction-id-3').should('exist')
      cy.get('#charge-id-transaction-id-4').should('exist')
    })

    it('should filter payments', () => {
      cy.task('setupStubs', [
        userStub,
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccount1, gatewayAccount2, gatewayAccount3]),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccount3.gatewayAccountId],
          transactions: [testTransactions[0]],
          filters: {
            reference: 'ref3'
          }
        }),
        gatewayAccountStubs.getCardTypesSuccess()
      ])

      cy.get('#reference').type('ref3')
      cy.get('#filter').click()
      cy.get('.transactions-list--row').should('have.length', 1)
      cy.get('#charge-id-transaction-id-3').should('exist')
    })

    it('should have correct breadcrumb navigation for test transactions', () => {
      cy.get('.govuk-breadcrumbs').within(() => {
        cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
        cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
        cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
      })
    })

    it('should display Transaction Detail page', () => {
      cy.task('setupStubs', [
        userStub,
        transactionStubs.getLedgerTransactionSuccess({ transactionDetails: testTransactions[0] }),
        gatewayAccountStubs.getGatewayAccountSuccess(gatewayAccount3),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess(gatewayAccount3),
        transactionStubs.getLedgerEventsSuccess({ transactionId: 'transaction-id-3' })
      ])

      cy.get('#charge-id-transaction-id-3').click()

      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('contain',
        'Service 2')
      cy.get('.transaction-details tbody').find('tr').eq(1).find('td').first().should('contain',
        'ref3')
    })

    it('should have correct breadcrumb navigation', () => {
      cy.get('.govuk-breadcrumbs').within(() => {
        cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
        cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
        cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
      })
    })

    it('should have correct back link', () => {
      cy.get('.govuk-back-link')
        .should('have.text', 'Back to transactions for all services')
        .should('have.attr', 'href', '/all-service-transactions/test?reference=ref3&email=&cardholderName=&lastDigitsCardNumber=&fromDate=&fromTime=&toDate=&toTime=&metadataValue=')
    })

    it('should refund a payment', () => {
      cy.task('setupStubs', [
        userStub,
        transactionStubs.getLedgerTransactionSuccess({ transactionDetails: testTransactions[0] }),
        gatewayAccountStubs.getGatewayAccountSuccess(gatewayAccount3),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess(gatewayAccount3),
        transactionStubs.getLedgerEventsSuccess({ transactionId: 'transaction-id-3' })
      ])

      cy.get('a.refund__toggle').click()
      cy.get('button').contains('Confirm refund').click()
    })

    it('should still have correct breadcrumb and back link', () => {
      cy.get('.govuk-breadcrumbs').within(() => {
        cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
        cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
        cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'TEST')
      })

      cy.get('.govuk-back-link')
        .should('have.text', 'Back to transactions for all services')
        .should('have.attr', 'href', '/all-service-transactions/test?reference=ref3&email=&cardholderName=&lastDigitsCardNumber=&fromDate=&fromTime=&toDate=&toTime=&metadataValue=')
    })
  })
})
