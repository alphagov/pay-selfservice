'use strict'

const { expect } = require('chai')

const { buildPaymentView } = require('./transaction-view')
const transactionFixtures = require('../../test/fixtures/ledger-transaction.fixtures')

describe('Transaction view utilities', () => {
  describe('disputed payment refundable', () => {
    const testCases = [
      {
        refund_summary_status: 'unavailable',
        expectations: { refund_unavailable_due_to_dispute: true, refundable: false }
      },
      {
        refund_summary_status: 'available',
        expectations: { refund_unavailable_due_to_dispute: false, refundable: true }
      },
      { refund_summary_status: 'error', expectations: { refund_unavailable_due_to_dispute: false, refundable: true } },
      { refund_summary_status: 'full', expectations: { refund_unavailable_due_to_dispute: false, refundable: false } },
      {
        refund_summary_status: 'pending',
        expectations: { refund_unavailable_due_to_dispute: false, refundable: false }
      }
    ]

    testCases.forEach(testCase => {
      it(`should return correct refundable fields for disputed payment with refund status ${testCase.refund_summary_status}`, () => {
        const transaction = transactionFixtures.validTransactionDetailsResponse({
          disputed: true,
          refund_summary_status: testCase.refund_summary_status
        })
        const events = transactionFixtures.validTransactionEventsResponse()
        const view = buildPaymentView(transaction, events, {})

        expect(view.refund_unavailable_due_to_dispute).to.equal(testCase.expectations.refund_unavailable_due_to_dispute)
        expect(view.refundable).to.equal(testCase.expectations.refundable)
      })
    })
  })

  describe('dispute data', () => {
    it('should build dispute data if dispute transaction is available', () => {
      const transaction = transactionFixtures.validTransactionDetailsResponse()
      const events = transactionFixtures.validTransactionEventsResponse()
      const disputeData = transactionFixtures.validDisputeTransactionDetails({ amount: 1000 })
      const paymentView = buildPaymentView(transaction, events, disputeData)

      expect(paymentView.dispute.amount_friendly).to.equal('£10.00')
    })
  })

  it('should set text to \'Data unavailable\' for fields redacted for PII', () => {
    const transaction = transactionFixtures.validTransactionDetailsResponse({
      reference: '<DELETED>',
      description: '<DELETED>',
      email: '<DELETED>',
      cardholder_name: '<DELETED>'
    })
    const events = transactionFixtures.validTransactionEventsResponse()
    const paymentView = buildPaymentView(transaction, events)

    expect(paymentView.reference).to.equal('Data unavailable')
    expect(paymentView.description).to.equal('Data unavailable')
    expect(paymentView.email).to.equal('Data unavailable')
    expect(paymentView.card_details.cardholder_name).to.equal('Data unavailable')
  })

  it('should not set text to \'Data unavailable\' for fields not redacted', () => {
    const transaction = transactionFixtures.validTransactionDetailsResponse({
      reference: 'ref-1',
      description: 'desc-1',
      email: 'test@example.org',
      cardholder_name: 'Jane D'
    })
    const events = transactionFixtures.validTransactionEventsResponse()
    const paymentView = buildPaymentView(transaction, events)

    expect(paymentView.reference).to.equal('ref-1')
    expect(paymentView.description).to.equal('desc-1')
    expect(paymentView.email).to.equal('test@example.org')
    expect(paymentView.card_details.cardholder_name).to.equal('Jane D')
  })
})
