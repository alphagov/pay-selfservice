import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import ledgerTransactionFixtures from '@test/fixtures/ledger-transaction.fixtures'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import response from '@utils/response'

function getTransaction(transactionExternalId: string) {
  const path = `/v1/transaction/${transactionExternalId}`

  return {
    success: function (transaction: TransactionFixture) {
      return stubBuilder('GET', path, 200, {
        response: transaction.toTransactionData(),
        query: {
          override_account_id_restriction: true,
        },
      })
    },
  }
}

function getTransactionForGatewayAccount(gatewayAccountId: string, transactionExternalId: string) {
  const path = `/v1/transaction/${transactionExternalId}`

  return {
    success: function (transaction: TransactionFixture) {
      return stubBuilder('GET', path, 200, {
        response: transaction.toTransactionData(),
        query: {
          account_id: gatewayAccountId,
        },
      })
    },
  }
}

function getTransactionsForGatewayAccount(gatewayAccountId: string, transactions: TransactionFixture[]) {
  const path = `/v1/transaction`


  return {
    success: function () {
      return stubBuilder('GET', path, 200, {
        response: transactions,

        // response: ledgerTransactionFixtures.validTransactionSearchResponse({
        //   // page: 1,
        //   // display_size: 100,
        //   // transaction_length: 1000,
        //   // transaction_count: 3,
        //   // gateway_account_id: gatewayAccountId,
        //   transactions,
        // }),
        query: {
          account_id: [gatewayAccountId],
          // page: 1,
          // display_size: 20,
          // limit_total: true,
          // limit_total_size: 5001,
          // // from_date: '2015-02-19T00:00:00.000 +00:00',
          // deepMatchRequest: false
        },
      })
    },
  }
}

function getTransactionEvents(gatewayAccountId: string, transactionExternalId: string) {
  const path = `/v1/transaction/${transactionExternalId}/event`

  return {
    success: function (events: TransactionEventFixture[]) {
      return stubBuilder('GET', path, 200, {
        response: ledgerTransactionFixtures.validTransactionEventsResponse({
          transaction_id: transactionExternalId,
          payment_states: events.map((event) => event.toEventData()),
        }),
        query: {
          gateway_account_id: gatewayAccountId,
        },
      })
    },
  }
}

export { getTransaction, getTransactionForGatewayAccount, getTransactionEvents, getTransactionsForGatewayAccount }