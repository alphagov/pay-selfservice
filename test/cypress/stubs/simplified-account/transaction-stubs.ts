import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import ledgerTransactionFixtures from '@test/fixtures/ledger-transaction.fixtures'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import refundFixtures from '@test/fixtures/refund.fixtures'
import { TransactionData } from '@models/transaction/dto/Transaction.dto'
import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'

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

function getTransactionsForGatewayAccount(gatewayAccountId: string) {
  const path = `/v1/transaction`

  return {
    success: function (transactions: TransactionData[]) {
      return stubBuilder('GET', path, 200, {
        response: {
          total: transactions.length,
          count: transactions.length,
          page: 1,
          results: transactions,
        },
        query: {
          account_id: [gatewayAccountId],
          page: 1,
          display_size: 20,
          limit_total: true,
          limit_total_size: 5001,
        },
      })
    },
  }
}

function searchTransactions(query: TransactionSearchParams) {
  const path = '/v1/transaction'

  return {
    success: function (transactions: TransactionFixture[], options?: { total?: number; page?: number }) {
      return stubBuilder('GET', path, 200, {
        query: query.toJson(),
        response: {
          total: options?.total ?? transactions.length,
          count: transactions.length,
          page: options?.page ?? 1,
          results: transactions.map((transaction) => transaction.toTransactionData()),
        },
      })
    },
  }
}

function searchTransactionsDefault(accountIds: number | number[] | string | string[]) {
  const query = TransactionSearchParams.Builder(accountIds)
    .withPagination(20)
    .withDefaultDateFilter('last-12-months')
    .withSearchQuery({})
  const searchStub = searchTransactions(query)

  return {
    success: function (transactions: TransactionFixture[]) {
      return searchStub.success(transactions)
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

function getTransactionDisputes(gatewayAccountId: string, transactionExternalId: string) {
  const path = `/v1/transaction/${transactionExternalId}/transaction`

  return {
    success: function (disputes: TransactionFixture[]) {
      return stubBuilder('GET', path, 200, {
        query: {
          gateway_account_id: gatewayAccountId,
          transaction_type: 'DISPUTE',
        },
        response: {
          parent_transaction_id: transactionExternalId,
          transactions: disputes.map((dispute) => dispute.toTransactionData()),
        },
      })
    },
  }
}

function postRefund(serviceExternalId: string, transactionExternalId: string) {
  const path = `/v1/api/service/${serviceExternalId}/account/test/charges/${transactionExternalId}/refunds`

  return {
    success: function (
      refundAmount: number,
      transaction: TransactionFixture,
      userExternalId: string,
      userEmail: string
    ) {
      return stubBuilder('POST', path, 200, {
        request: refundFixtures.validTransactionRefundRequest({
          amount: refundAmount,
          refund_amount_available: transaction.amount,
          user_external_id: userExternalId,
          user_email: userEmail,
        }),
      })
    },
  }
}

export {
  getTransaction,
  getTransactionForGatewayAccount,
  getTransactionsForGatewayAccount,
  getTransactionEvents,
  getTransactionDisputes,
  searchTransactions,
  searchTransactionsDefault,
  postRefund,
}
