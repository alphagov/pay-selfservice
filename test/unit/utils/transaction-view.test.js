'use strict'

const { expect } = require('chai')

const { buildPaymentView } = require('../../../app/utils/transaction-view')
const transactionFixtures = require('../../fixtures/ledger-transaction.fixtures')

describe('Transaction view utilities', () => {
  describe('disputed payment refundable', () => {
    const testCases = [
      {refund_summary_status: "unavailable", expectations: { refund_unavailable_due_to_dispute: true, refundable: false } },
      {refund_summary_status: "available", expectations: { refund_unavailable_due_to_dispute: false, refundable: true } },
      {refund_summary_status: "error", expectations: { refund_unavailable_due_to_dispute: false, refundable: true } },
      {refund_summary_status: "full", expectations: { refund_unavailable_due_to_dispute: false, refundable: false } },
      {refund_summary_status: "pending", expectations: { refund_unavailable_due_to_dispute: false, refundable: false } },
    ]

    testCases.forEach(testCase => {
      it(`should return correct refundable fields for disputed payment with refund status ${testCase.refund_summary_status}`, () => {
        const transaction = transactionFixtures.validTransactionDetailsResponse({
          disputed: true,
          refund_summary_status: testCase.refund_summary_status
        })
        const events = transactionFixtures.validTransactionEventsResponse()
        const view = buildPaymentView(transaction, events)
    
        expect(view.refund_unavailable_due_to_dispute).to.equal(testCase.expectations.refund_unavailable_due_to_dispute)
        expect(view.refundable).to.equal(testCase.expectations.refundable)
      })
    })
  })
})