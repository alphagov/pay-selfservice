'use strict'

const userStubs = require('../../stubs/user-stubs')
const gatewayAccountStubs = require('../../stubs/gateway-account-stubs')
const transactionStubs = require('../../stubs/transaction-stubs')
const stripeAccountSetupStubs = require('../../stubs/stripe-account-setup-stub')

describe('All service transactions', () => {
  const userExternalId = 'cd0fa54cf3b7408a80ae2f1b93e7c16e'
  const gatewayAccountId1 = 42
  const gatewayAccountId2 = 43
  const gatewayAccountExternalId1 = 'a-valid-external-id-1'
  const gatewayAccountExternalId2 = 'a-valid-external-id-2'
  const transactionsUrl = `/all-service-transactions`
  const defaultAmount = 1000

  const defaultTransactionEvents = [{
    amount: defaultAmount,
    state: {
      finished: false,
      status: 'created'
    },
    resource_type: 'PAYMENT',
    event_type: 'PAYMENT_CREATED',
    timestamp: '2019-09-18T10:06:17.152Z',
    data: {}
  }]

  function generateTransactions (length) {
    const transactions = []
    for (let i = 0; i < length; i++) {
      transactions.push({
        reference: 'transaction' + i,
        amount: defaultAmount,
        type: 'payment',
        transaction_id: 'transaction-id-' + i,
        gateway_account_id: String(gatewayAccountId1),
        events: defaultTransactionEvents
      })
    }
    return transactions
  }

  function transactionSearchResultOpts (transactionLength, displaySize, page, filters, links) {
    return {
      gatewayAccountIds: [ gatewayAccountId1, gatewayAccountId2 ],
      transactionLength: transactionLength || 50,
      displaySize: displaySize || 5,
      page: page || 1,
      transactionCount: 3,
      transactions: generateTransactions(2),
      filters: filters,
      links: links || {}
    }
  }

  describe('Visiting All Service Transactions', () => {
    beforeEach(() => {
      Cypress.Cookies.preserveOnce('session', 'gateway_account')
    })

    it('should display All Service Transactions list page', () => {
      cy.setEncryptedCookies(userExternalId, gatewayAccountId1)
      const opts = transactionSearchResultOpts(30, 5, 1, {},
        {
          self: { href: '/v1/transactions?&page=&display_size=5&state=' },
          next_page: { href: '/v1/transactions?&page=3&display_size=5&state=' }
        })

      cy.task('setupStubs', [
        userStubs.getUserSuccessWithMultipleServices({ userExternalId, gatewayAccountId1, gatewayAccountId2, gatewayAccountExternalId1, gatewayAccountExternalId2 }),
        gatewayAccountStubs.getGatewayAccountsSuccessForMultipleAccounts({ gatewayAccountIds: [gatewayAccountId1, gatewayAccountId2], gatewayAccountId1, gatewayAccountId2, gatewayAccountExternalId1, gatewayAccountExternalId2, type: 'live', paymentProvider: 'stripe' }),
        transactionStubs.getLedgerTransactionsSuccess(opts),
        gatewayAccountStubs.getCardTypesSuccess()
      ])

      cy.visit(transactionsUrl + '?pageSize=5&page=')
      cy.title().should('eq', `Transactions for all live services`)
    })

    it('should display Transaction Detail page', () => {
      const transactions = generateTransactions(1)

      cy.task('setupStubs', [
        userStubs.getUserSuccessWithMultipleServices({ userExternalId, gatewayAccountId1, gatewayAccountId2, gatewayAccountExternalId1, gatewayAccountExternalId2 }),
        transactionStubs.getLedgerTransactionSuccess({ transactionDetails: transactions[0] }),
        gatewayAccountStubs.getGatewayAccountSuccess({ gatewayAccountId: gatewayAccountId1, gatewayAccountExternalId: gatewayAccountExternalId1 }),
        gatewayAccountStubs.getGatewayAccountByExternalIdSuccess({
          gatewayAccountId: gatewayAccountId1,
          gatewayAccountExternalId: gatewayAccountExternalId1,
          paymentProvider: 'stripe',
          allowMoto: false }),
        stripeAccountSetupStubs.getGatewayAccountStripeSetupSuccess({ gatewayAccountId: gatewayAccountId1, bankAccount: true, responsiblePerson: true, vatNumber: true, companyNumber: true }),
        transactionStubs.getLedgerEventsSuccess({ transactionId: 'transaction-id-0', events: defaultTransactionEvents })
      ])

      cy.get('#charge-id-transaction-id-0').click()

      cy.get('.transaction-details tbody').find('tr').first().find('td').first().should('contain',
        'System Generated')
      cy.get('.transaction-details tbody').find('tr').eq(1).find('td').first().should('contain',
        'transaction0')
    })
  })
})
