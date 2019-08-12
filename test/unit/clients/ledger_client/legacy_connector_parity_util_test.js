const assert = require('assert')
const {
  legacyConnectorTransactionParity,
  legacyConnectorEventsParity
} = require('../../../../app/services/clients/utils/ledger_legacy_connector_parity')

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

    it('Correcly transforms resource type', () => {
      const { events } = legacyConnectorEventsParity(ledgerTransactionEventsFixture)
      const result = events[0]
      assert.strictEqual(result.type, 'payment')
    })
  })
})
