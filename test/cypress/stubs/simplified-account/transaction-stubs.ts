import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import ledgerTransactionFixtures from '@test/fixtures/ledger-transaction.fixtures'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'


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

export { getTransaction, getTransactionForGatewayAccount, getTransactionEvents }