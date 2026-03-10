import { stubBuilder } from '@test/cypress/stubs/stub-builder'
import ledgerTransactionFixtures from '@test/fixtures/ledger-transaction.fixtures'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { TransactionEventFixture } from '@test/fixtures/transaction/transaction-event.fixture'
import refundFixtures from '@test/fixtures/refund.fixtures'
import { last12MonthsStartDate } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { TransactionData } from '@models/transaction/dto/Transaction.dto'

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
          from_date: last12MonthsStartDate,
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
  postRefund,
}
