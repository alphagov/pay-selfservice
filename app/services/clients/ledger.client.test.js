'use strict'

const sinon = require('sinon')
const proxyquire = require('proxyquire')
const { expect } = require('chai')
const transactionDetailsFixtures = require('../../../test/fixtures/ledger-transaction.fixtures')

const configureSpy = sinon.spy()

const validCreatedTransactionDetailsResponse = transactionDetailsFixtures.validTransactionCreatedDetailsResponse({
  transaction_id: 'ch_123abc456xyz',
  type: 'payment',
  amount: 100,
  fee: 5,
  net_amount: 95,
  refund_summary_available: 100
})

const validTransactionSearchResponse = transactionDetailsFixtures.validTransactionSearchResponse({
  gateway_account_id: '123456',
  transactions: [
    {
      amount: 2000,
      state: {
        status: 'success',
        finished: true
      },
      transaction_id: '222222',
      created_date: '2018-09-22T10:14:15.067Z',
      refund_summary_status: 'available',
      refund_summary_available: 1850,
      amount_submitted: 150,
      type: 'payment',
      card_brand: 'visa'
    }
  ]
})

const ledgerTransactionEventsFixture = {
  events: [{
    timestamp: 'some-iso-timestamp',
    resource_type: 'PAYMENT',
    data: {}
  }]
}

const validTransactionSummaryResponse = transactionDetailsFixtures.validTransactionSummaryDetails({
  account_id: '123456',
  from_date: '2019-09-19T13:00:00.000Z',
  to_date: '2019-09-22T00:00:00.000Z',
  paymentCount: 2,
  paymentTotal: 3500,
  refundCount: 1,
  refundTotal: 1000
})

class MockClient {
  configure (baseUrl, options) {
    configureSpy(baseUrl, options)
  }

  async get (url, description) {
    let dataResponse

    if (url.match(/\.*\/event/)) { dataResponse = ledgerTransactionEventsFixture }
    else if (url.match(/\/transaction\//)) dataResponse = { validCreatedTransactionDetailsResponse }
    else if (url.match(/\/report\/transactions-summary/)) { dataResponse = validTransactionSummaryResponse }
    else if (url.match(/\/agreement/)) dataResponse = { validTransactionSummaryResponse }
    else if (url.match(/\/payout/)) dataResponse = {}
    else if (url.match(/\/transaction\?account_id.*limit_total/)) { dataResponse = validTransactionSearchResponse }
    else dataResponse = {}

    return Promise.resolve({ data: dataResponse })
  }
}

function getLedgerClient () {
  return proxyquire('./ledger.client', {
    '@govuk-pay/pay-js-commons/lib/utils/axios-base-client/axios-base-client': { Client: MockClient }
  })
}

describe('Ledger client', () => {
  describe('transaction function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transaction('id', 'a-gateway-account-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/transaction/id?account_id=a-gateway-account-id')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transaction('id', 'a-gateway-account-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/transaction/id?account_id=a-gateway-account-id')
    })
  })

  describe('transactionWithAccountOverride function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transactionWithAccountOverride('id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/transaction/id?override_account_id_restriction=true')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transactionWithAccountOverride('id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/transaction/id?override_account_id_restriction=true')
    })
  })

  describe('getDisputesForTransaction function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.getDisputesForTransaction('id', 'a-gateway-account-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/transaction/id/transaction?gateway_account_id=a-gateway-account-id&transaction_type=DISPUTE')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.getDisputesForTransaction('id', 'a-gateway-account-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/transaction/id/transaction?gateway_account_id=a-gateway-account-id&transaction_type=DISPUTE')
    })
  })

  describe('events function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.events('transaction_id', 'a-gateway-account-id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/transaction/transaction_id/event?gateway_account_id=a-gateway-account-id')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.events('transaction_id', 'a-gateway-account-id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/transaction/transaction_id/event?gateway_account_id=a-gateway-account-id')
    })
  })

  describe('transactions function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transactions(['a-gateway-account-id'], {}, {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/transaction?account_id=a-gateway-account-id&limit_total=true&limit_total_size=5001&page=1&display_size=100')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transactions(['a-gateway-account-id'], {}, { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/transaction?account_id=a-gateway-account-id&limit_total=true&limit_total_size=5001&page=1&display_size=100')
    })
  })

  describe('transactionSummary function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transactionSummary('a-gateway-account-id', '', '', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/report/transactions-summary?account_id=a-gateway-account-id&from_date=&to_date=')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.transactionSummary('a-gateway-account-id', '', '', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/report/transactions-summary?account_id=a-gateway-account-id&from_date=&to_date=')
    })
  })

  describe('payouts function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.payouts([], 1, 100, {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/payout?gateway_account_id=&state=paidout&page=1&display_size=100')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.payouts([], 1, 100, { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/payout?gateway_account_id=&state=paidout&page=1&display_size=100')
    })
  })

  describe('agreements function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.agreements('serviceId', 'live', 'accountId', 1, {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/agreement?service_id=serviceId&account_id=accountId&live=live&page=1')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.agreements('serviceId', 'live', 'accountId', 1, { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/agreement?service_id=serviceId&account_id=accountId&live=live&page=1')
    })
  })

  describe('agreement function', () => {
    beforeEach(() => {
      configureSpy.resetHistory()
    })

    it('should use default base URL when base URL has not been set', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.agreement('id', 'service_id', {})

      expect(configureSpy.getCall(0).args[0]).to.equal('http://127.0.0.1:8006/v1/agreement/id?service_id=service_id')
    })

    it('should use configured base url', async () => {
      const ledgerClient = getLedgerClient()

      await ledgerClient.agreement('id', 'service_id', { baseUrl: 'https://example.com' })

      expect(configureSpy.getCall(0).args[0]).to.equal('https://example.com/v1/agreement/id?service_id=service_id')
    })
  })
})
