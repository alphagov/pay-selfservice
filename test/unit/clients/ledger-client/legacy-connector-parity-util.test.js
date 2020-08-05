const assert = require('assert')
const {
  legacyConnectorTransactionParity,
  legacyConnectorTransactionsParity,
  legacyConnectorEventsParity,
  legacyConnectorTransactionSummaryParity
} = require('../../../../app/services/clients/utils/ledger-legacy-connector-parity')

describe('Ledger service client legacy parity utilities', () => {
  describe('Transaction parity', () => {
    it('Correctly maps fields from expected ledger values to current connector names', () => {
      const ledgerTransactionFixture = {
        transaction_id: 'some-transaction-id',
        refund_summary: {
          amount_refunded: 1000
        }
      }

      const result = legacyConnectorTransactionParity(ledgerTransactionFixture)
      assert.strictEqual(result.charge_id, 'some-transaction-id')
      assert.strictEqual(result.refund_summary.amount_submitted, 1000)
    })

    it('Correctly maps ledger values on refund parent transaction to current connector names', () => {
      const ledgerTransactionFixture = {
        transaction_id: 'some-transaction-id',
        parent_transaction_id: 'payment-transaction-id',
        transaction_type: 'REFUND',
        refunded_by: 'f579410614654249987ad939f5ef53a1',
        refund_summary: {
          amount_refunded: 1000
        },
        gateway_transaction_id: 'refund-gateway-transaction-id',
        payment_details: {
          reference: 'payment-reference',
          description: 'payment-description',
          email: 'test-email@example.org',
          card_details: {
            cardholder_name: 'test-name',
            card_brand: 'visa',
            last_digits_card_number: '5556',
            first_digits_card_number: '400005',
            expiry_date: '11/21'
          }
        }
      }

      const result = legacyConnectorTransactionParity(ledgerTransactionFixture)
      assert.strictEqual(result.charge_id, 'payment-transaction-id')
      assert.strictEqual(result.refund_summary.user_external_id, 'f579410614654249987ad939f5ef53a1')
      assert.strictEqual(result.gateway_transaction_id, 'refund-gateway-transaction-id')
      assert.strictEqual(result.reference, 'payment-reference')
      assert.strictEqual(result.description, 'payment-description')
      assert.strictEqual(result.email, 'test-email@example.org')
      assert.strictEqual(result.card_details.cardholder_name, 'test-name')
      assert.strictEqual(result.card_details.card_brand, 'visa')
      assert.strictEqual(result.card_details.last_digits_card_number, '5556')
      assert.strictEqual(result.card_details.first_digits_card_number, '400005')
      assert.strictEqual(result.card_details.expiry_date, '11/21')
      assert.strictEqual(result.refund_summary.amount_submitted, 1000)
    })
  })

  describe('Event parity', () => {
    const ledgerTransactionEventsFixture = {
      events: [{
        timestamp: 'some-iso-timestamp',
        resource_type: 'PAYMENT',
        data: {}
      }]
    }

    const ledgerTransactionRefundedEventFixture = {
      events: [{
        timestamp: 'some-iso-timestamp',
        resource_type: 'REFUND',
        data: {
          refunded_by: 'some-user-id'
        }
      }]
    }
    it('Correctly maps fields from expected ledger values to current connector names', () => {
      const { events } = legacyConnectorEventsParity(ledgerTransactionEventsFixture)
      const result = events[0]
      assert.strictEqual(result.updated, 'some-iso-timestamp')
      assert(result.type)
    })

    it('Only maps refunded by values if the event contains user refunded details', () => {
      const { events: paymentEvents } = legacyConnectorEventsParity(ledgerTransactionEventsFixture)
      const paymentResult = paymentEvents[0]
      const { events: refundEvents } = legacyConnectorEventsParity(ledgerTransactionRefundedEventFixture)
      const refundResult = refundEvents[0]

      assert.strictEqual(paymentResult.submitted_by, undefined)
      assert.strictEqual(refundResult.submitted_by, 'some-user-id')
    })

    it('Correctly transforms resource type', () => {
      const { events } = legacyConnectorEventsParity(ledgerTransactionEventsFixture)
      const result = events[0]
      assert.strictEqual(result.type, 'payment')
    })
  })

  describe('Transactions parity', () => {
    it('Applies transaction parity to the result set of a search response', () => {
      const ledgerTransactionsSearchFixture = {
        results: [{
          transaction_id: 'some-charge-id'
        },
        {
          transaction_id: 'some-transaction-id',
          parent_transaction_id: 'payment-transaction-id',
          transaction_type: 'REFUND',
          refunded_by: 'f579410614654249987ad939f5ef53a1',
          payment_details: {
            reference: 'payment-reference'
          }
        }]
      }
      const transactions = legacyConnectorTransactionsParity(ledgerTransactionsSearchFixture)

      assert.strictEqual(transactions.results[0].charge_id, 'some-charge-id')
      assert.strictEqual(transactions.results[1].charge_id, 'payment-transaction-id')
      assert.strictEqual(transactions.results[1].refund_summary.user_external_id, 'f579410614654249987ad939f5ef53a1')
      assert.strictEqual(transactions.results[1].reference, 'payment-reference')
    })
  })

  describe('Transaction Summary parity', () => {
    it('Applies transaction summary to the result set of a transaction summary response', () => {
      const ledgerTransactionSummaryFixture = {
        payments: {
          count: 10,
          gross_amount: 12001
        },
        refunds: {
          count: 2,
          gross_amount: 2302
        }
      }
      const summary = legacyConnectorTransactionSummaryParity(ledgerTransactionSummaryFixture)
      assert.strictEqual(summary.successful_payments.count, 10)
      assert.strictEqual(summary.successful_payments.total_in_pence, 12001)
      assert.strictEqual(summary.refunded_payments.count, 2)
      assert.strictEqual(summary.refunded_payments.total_in_pence, 2302)
    })
  })
})
