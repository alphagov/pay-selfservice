'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

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
      reference: 'gateway-account-1-transaction',
      transaction_id: 'transaction-id-1',
      live: true
    },
    {
      gateway_account_id: String(gatewayAccount2.gatewayAccountId),
      reference: 'gateway-account-2-transaction',
      transaction_id: 'transaction-id-2',
      live: true
    }
  ]
  const testTransactions = [
    {
      gateway_account_id: String(gatewayAccount3.gatewayAccountId),
      reference: 'gateway-account-3-transaction',
      transaction_id: 'transaction-id-3',
      live: false
    }
  ]

  describe('Visiting All Service Transactions', () => {
    beforeEach(() => {
      Cypress.Cookies.preserveOnce('session', 'gateway_account')
    })

    it('should display All Service Transactions list page with live transactions', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccount1.gatewayAccountId)
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

    it('should display Transaction Detail page', () => {
      cy.task('setupStubs', [
        userStub,
        transactionStubs.getLedgerTransactionSuccess({ transactionDetails: liveTransactions[0] }),
        gatewayAccountStubs.getGatewayAccountSuccess(gatewayAccount1),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess(gatewayAccount1),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId: gatewayAccount1.gatewayAccountId, bankAccount: true, responsiblePerson: true, vatNumber: true, companyNumber: true }),
        transactionStubs.getLedgerEventsSuccess({ transactionId: 'transaction-id-1' })
      ])

      cy.get('#charge-id-transaction-id-1').click()

      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('contain',
        'Service 1')
      cy.get('.transaction-details tbody').find('tr').eq(1).find('td').first().should('contain',
        'gateway-account-1-transaction')
    })

    it('should have correct breadcrumb navigation', () => {
      cy.get('.govuk-breadcrumbs').within(() => {
        cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
        cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
        cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'LIVE')
      })
    })

    it('should go back to all services transactions when back button clicked', () => {
      cy.task('setupStubs', [
        userStub,
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccount1, gatewayAccount2, gatewayAccount3]),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccount1.gatewayAccountId, gatewayAccount2.gatewayAccountId],
          transactions: liveTransactions
        }),
        gatewayAccountStubs.getCardTypesSuccess()
      ])
      cy.get('.govuk-back-link').should('have.text', 'Back to transactions for all services').click()

      cy.title().should('eq', `Transactions for all services`)
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
  })
})
