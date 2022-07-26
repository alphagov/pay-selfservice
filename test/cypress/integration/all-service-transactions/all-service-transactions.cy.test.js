'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')

describe('All service transactions', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const transactionsUrl = `/all-service-transactions`

  const gatewayAccountStripe = {
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

  const disputeTransactions = [
    {
      gateway_account_id: String(gatewayAccountStripe.gatewayAccountId),
      reference: 'ref1',
      transaction_id: 'transaction-id-1',
      parent_transaction_id: 'parent-transaction-id-1',
      live: true,
      type: 'dispute',
      includePaymentDetails: true,
      status: 'needs_response',
      amount: 2500
    },
    {
      gateway_account_id: String(gatewayAccount2.gatewayAccountId),
      reference: 'ref2',
      transaction_id: 'transaction-id-2',
      parent_transaction_id: 'parent-transaction-id-2',
      live: true,
      type: 'dispute',
      includePaymentDetails: true,
      status: 'lost',
      amount: 3500,
      net_amount: -5000,
      fee: 1500
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
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccountStripe.gatewayAccountId, gatewayAccount2.gatewayAccountId],
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

    it('should display dispute statuses in the dropdown and dispute information correctly - when enabled', () => {
      cy.setEncryptedCookies(userExternalId)
      cy.task('setupStubs', [
        userStub,
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccountStripe.gatewayAccountId, gatewayAccount2.gatewayAccountId],
          transactions: []
        }),
        transactionStubs.getLedgerTransactionsSuccess({
          gatewayAccountIds: [gatewayAccountStripe.gatewayAccountId, gatewayAccount2.gatewayAccountId],
          transactions: disputeTransactions,
          filters: {
            dispute_states: 'needs_response,under_review'
          }
        }),
        gatewayAccountStubs.getCardTypesSuccess()
      ])

      cy.visit(transactionsUrl)
      cy.title().should('eq', `Transactions for all services`)

      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute awaiting evidence')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute under review')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute won in your favour')
      cy.get('#list-of-sectors-state').invoke('text').should('contain', 'Dispute lost to customer')

      cy.get('#state').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='Dispute awaiting evidence']`).trigger('mouseover').click()
      cy.get(`#list-of-sectors-state .govuk-checkboxes__input[value='Dispute under review']`).trigger('mouseover').click()

      cy.get('#filter').click()
      cy.get('.transactions-list--row').should('have.length', 2)
      cy.get('#charge-id-parent-transaction-id-1').should('exist')
      cy.get('#charge-id-parent-transaction-id-2').should('exist')

      assertTransactionRow(0, disputeTransactions[0].reference, `/redirect/transactions/parent-transaction-id-1`,
        'test@example.org', '–£25.00', 'Visa', 'Dispute awaiting evidence', '', '')
      assertTransactionRow(1, disputeTransactions[1].reference, `/redirect/transactions/parent-transaction-id-2`,
        'test@example.org', '–£35.00', 'Visa', 'Dispute lost to customer', '-£50.00', '£15.00')

      cy.get('#download-transactions-link').should('have.attr', 'href', `/all-service-transactions/download?dispute_states=needs_response&dispute_states=under_review`)
    })

    it('should have correct breadcrumb navigation', () => {
      cy.get('.govuk-breadcrumbs').within(() => {
        cy.get('.govuk-breadcrumbs__list-item').should('have.length', 2)
        cy.get('.govuk-breadcrumbs__list-item').eq(1).contains('Transactions for all services')
        cy.get('.govuk-breadcrumbs__list-item').eq(1).find('.govuk-tag').should('have.text', 'LIVE')
      })
    })

    it('should show test transactions when Switch to test accounts link clicked', () => {
      cy.task('setupStubs', [
        userStub,
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
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
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts([gatewayAccountStripe, gatewayAccount2, gatewayAccount3]),
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

  function assertTransactionRow (row, reference, transactionLink, email, amount, cardBrand, state, netAmount, fee) {
    cy.get('#transactions-list tbody').find('tr').eq(row).find('th').should('contain', reference)
    cy.get('#transactions-list tbody').find('tr > th').eq(row).find('.reference')
      .should('have.attr', 'href', transactionLink)
    cy.get('#transactions-list tbody').find('tr').eq(row).find('.email').should('contain', email)
    cy.get('#transactions-list tbody').find('tr').eq(row).find('.amount').should('contain', amount)
    cy.get('#transactions-list tbody').find('tr').eq(row).find('.brand').should('contain', cardBrand)
    cy.get('#transactions-list tbody').find('tr').eq(row).find('.state').should('contain', state)

    cy.get('#transactions-list tbody').find('tr').eq(row).get('[data-cell-type="net"]').eq(row).find('span').should('have.text', netAmount)
    cy.get('#transactions-list tbody').find('tr').eq(row).get('[data-cell-type="fee"]').eq(row).should('have.text', fee)
  }
})
