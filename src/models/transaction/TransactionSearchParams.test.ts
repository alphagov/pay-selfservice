import { TransactionSearchParams } from '@models/transaction/TransactionSearchParams.class'
import sinon from 'sinon'
import { afterEach, beforeEach } from 'mocha'
import { Period } from '@utils/simplified-account/services/dashboard/datetime-utils'
import { expect } from 'chai'

describe('Transaction search params tests', () => {
  let clock: sinon.SinonFakeTimers

  beforeEach(() => {
    // January 15, 2025, 14:30:00 UTC as fixed "now"
    const fixedDate = new Date('2025-01-15T14:30:00.000Z')
    clock = sinon.useFakeTimers(fixedDate)
  })

  afterEach(() => {
    clock.restore()
  })

  it('should produce correct query params when only a gatewayPayoutId is provided', () => {
    const testGatewayAccountIds = ['1', '2', '3']
    const searchParams = TransactionSearchParams.Builder(testGatewayAccountIds).withSearchQuery({
      gatewayPayoutId: 'gateway-payout-id-abc-123',
    })

    const queryString = searchParams.toJson().asQueryString()
    queryString.should.eq('account_id=1%2C2%2C3&gateway_payout_id=gateway-payout-id-abc-123')
  })

  it('should allow setting fee headers', () => {
    const testGatewayAccountId = 1
    const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({}).withFeeHeaders(true)

    const queryString = searchParams.toJson().asQueryString()
    queryString.should.eq('account_id=1&fee_headers=true')
  })

  it('should allow setting moto header', () => {
    const testGatewayAccountId = 1
    const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({}).withMotoHeader(true)

    const queryString = searchParams.toJson().asQueryString()
    queryString.should.eq('account_id=1&moto_header=true')
  })

  it('should allow setting default date params', () => {
    const testGatewayAccountId = 1
    const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withDefaultDateFilter(
      Period.LAST_12_MONTHS
    )

    const ledgerQuery = searchParams.toJson()
    ledgerQuery.from_date!.should.eq('2024-01-15T00:00:00.000Z')
    ledgerQuery.to_date!.should.eq('2025-01-15T23:59:59.999Z')

    const queryString = ledgerQuery.asQueryString()
    queryString.should.eq(
      `account_id=1&from_date=${encodeURIComponent('2024-01-15T00:00:00.000Z')}&to_date=${encodeURIComponent('2025-01-15T23:59:59.999Z')}`
    )
  })

  it('should allow setting pagination', () => {
    const testGatewayAccountId = 1
    const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withPagination(20).withSearchQuery({})

    const ledgerQuery = searchParams.toJson()
    ledgerQuery.limit_total!.should.eq(true)
    ledgerQuery.limit_total_size!.should.eq('5001')
    ledgerQuery.display_size!.should.eq('20')
    ledgerQuery.page!.should.eq('1')

    const queryString = ledgerQuery.asQueryString()
    queryString.should.eq('account_id=1&limit_total=true&limit_total_size=5001&display_size=20&page=1')
  })

  it('should ignore empty string values in the search query', () => {
    const testGatewayAccountId = 1
    const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
      reference: 'test-reference',
      cardholderName: '',
      metadataValue: '',
      email: '',
      state: 'success',
    })

    const ledgerQuery = searchParams.toJson()
    ledgerQuery.reference!.should.eq('test-reference')
    ledgerQuery.payment_states!.should.eq('success')

    expect(ledgerQuery.cardholder_name).to.be.undefined
    expect(ledgerQuery.metadata_value).to.be.undefined
    expect(ledgerQuery.email).to.be.undefined

    const queryString = ledgerQuery.asQueryString()
    queryString.should.eq('account_id=1&reference=test-reference&payment_states=success')
  })

  describe('state filter tests', () => {
    it('should correctly handle a single state', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: 'success',
      })

      const ledgerQuery = searchParams.toJson()
      ledgerQuery.payment_states!.should.eq('success')

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq('account_id=1&payment_states=success')
    })

    it('should correctly handle payment states', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: ['success', 'declined'],
      })

      const ledgerQuery = searchParams.toJson()
      ledgerQuery.payment_states!.should.eq('success,declined')
      expect(ledgerQuery.refund_states).to.be.undefined
      expect(ledgerQuery.dispute_states).to.be.undefined

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq(`account_id=1&payment_states=${encodeURIComponent('success,declined')}`)
    })

    it('should correctly handle refund states', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: ['refund_success', 'refund_error'],
      })

      const ledgerQuery = searchParams.toJson()
      expect(ledgerQuery.payment_states).to.be.undefined
      ledgerQuery.refund_states!.should.eq('success,error')
      expect(ledgerQuery.dispute_states).to.be.undefined

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq(`account_id=1&refund_states=${encodeURIComponent('success,error')}`)
    })

    it('should correctly handle dispute states', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: ['dispute_awaiting_evidence', 'dispute_under_review', 'dispute_won'],
      })

      const ledgerQuery = searchParams.toJson()
      expect(ledgerQuery.payment_states).to.be.undefined
      expect(ledgerQuery.refund_states).to.be.undefined
      ledgerQuery.dispute_states!.should.eq('needs_response,under_review,won')

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq(`account_id=1&dispute_states=${encodeURIComponent('needs_response,under_review,won')}`)
    })

    it('should correctly handle multiple transaction type states', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: [
          'cancelled',
          'error',
          'timed_out',
          'refund_submitted',
          'dispute_awaiting_evidence',
          'dispute_under_review',
          'dispute_won',
        ],
      })

      const ledgerQuery = searchParams.toJson()
      ledgerQuery.payment_states!.should.eq('cancelled,error,timedout')
      ledgerQuery.refund_states!.should.eq('submitted')
      ledgerQuery.dispute_states!.should.eq('needs_response,under_review,won')

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq(
        `account_id=1&payment_states=${encodeURIComponent('cancelled,error,timedout')}&refund_states=${encodeURIComponent('submitted')}&dispute_states=${encodeURIComponent('needs_response,under_review,won')}`
      )
    })

    it('should correctly handle states as a csv list instead of an array', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: 'success,cancelled,timed_out,refund_created,refund_error,dispute_lost',
      })

      const ledgerQuery = searchParams.toJson()
      ledgerQuery.payment_states!.should.eq('success,cancelled,timedout')
      ledgerQuery.refund_states!.should.eq('created,error')
      ledgerQuery.dispute_states!.should.eq('lost')

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq(
        `account_id=1&payment_states=${encodeURIComponent('success,cancelled,timedout')}&refund_states=${encodeURIComponent('created,error')}&dispute_states=${encodeURIComponent('lost')}`
      )
    })

    it('should ignore erroneous states', () => {
      const testGatewayAccountId = 1
      const searchParams = TransactionSearchParams.Builder(testGatewayAccountId).withSearchQuery({
        state: [
          'cancelled',
          'pending',
          'notastate',
          'this is also not a state',
          'refund_rejected_for_some_reason',
          'refund_not_allowed',
          'refund_this_is_not_a_state',
          'dispute_cancelled_by_user_for_some_reason',
          'dispute_won',
          'dispute_lost',
          'transaction_invalid',
          '1234567890',
        ],
      })

      const ledgerQuery = searchParams.toJson()
      ledgerQuery.payment_states!.should.eq('cancelled')
      expect(ledgerQuery.refund_states).to.be.undefined
      ledgerQuery.dispute_states!.should.eq('won,lost')

      const queryString = ledgerQuery.asQueryString()
      queryString.should.eq(`account_id=1&payment_states=cancelled&dispute_states=${encodeURIComponent('won,lost')}`)
    })
  })
})
