import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { DateTime } from 'luxon'
import { expect } from 'chai'
import { TransactionFixture } from '@test/fixtures/transaction/transaction.fixture'
import { TransactionStateFixture } from '@test/fixtures/transaction/transaction-state.fixture'
import { CardDetailsFixture } from '@test/fixtures/card-details/card-details.fixture'

const SERVICE_EXTERNAL_ID = 'service123abc'
const TRANSACTION_EXTERNAL_ID = 'transaction123abc'
const GATEWAY_ACCOUNT_ID = '117'
const CARDHOLDER_NAME = 'Sam Holder'
const EMAIL = 'sam_holder@example.com'
const LAST_DIGITS_CARD_NUMBER = '1234'
const METADATA_VALUE = 'order-5678'
const CARD_BRAND = 'visa'
const REFERENCE = 'REF 123'
const NOW_DATE_TIME = '2025-11-02T11:47:32.980Z'

const transaction = new TransactionFixture({
  gatewayAccountId: GATEWAY_ACCOUNT_ID,
  serviceExternalId: SERVICE_EXTERNAL_ID,
  externalId: TRANSACTION_EXTERNAL_ID,
  transactionType: 'PAYMENT',
  gatewayTransactionId: '11933338-20de-4792-bbee-8d19258dabc3',
  reference: REFERENCE,
  state: new TransactionStateFixture({
    finished: true,
    code: 'P0010',
    message: 'Payment method rejected',
    status: 'DECLINED',
  }),
  amount: 145600,
  createdDate: DateTime.fromISO('2025-09-12T11:47:32.980+01:00'),
  email: EMAIL,
  cardDetails: new CardDetailsFixture({
    cardBrand: 'Visa',
  }),
})

const mockResponse = sinon.stub()
const mockLedgerService = {
  searchTransactions: sinon.stub().resolves({
    total: 1,
    count: 1,
    page: 1,
    transactions: [transaction.toTransaction()],
  }),
}

const mockCardTypesService = {
  getAllCardTypes: sinon.stub().resolves([{ brand: 'visa', label: 'Visa' }]),
}

let nowStub: sinon.SinonFakeTimers

const { nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/transactions/transaction-list.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/transactions.service': mockLedgerService,
    '@services/card-types.service': mockCardTypesService,
  })
  .withServiceExternalId(SERVICE_EXTERNAL_ID)
  .withAccount({
    id: GATEWAY_ACCOUNT_ID,
    type: GatewayAccountType.TEST,
  })
  .withUrl(
    `https://wwww.payments.example.com/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions`
  )
  .build()

describe('controller: services/ledger', () => {
  before(() => {
    nowStub = sinon.useFakeTimers({
      now: DateTime.fromISO(NOW_DATE_TIME).toMillis(),
      shouldAdvanceTime: false,
    })
  })
  after(() => {
    nowStub.restore()
  })
  describe('get', () => {
    describe('transactions exist for service, no filters', () => {
      beforeEach(async () => {
        await call('get')
      })

      it('should call the response method', () => {
        sinon.assert.calledOnce(mockResponse)
      })

      it('should pass correct template path to the response method', () => {
        sinon.assert.calledWith(mockResponse, sinon.match.any, sinon.match.any, 'simplified-account/transactions/index')
      })

      it('should set results on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const results = context.results as {
          count: number
          total: number
          transactions: Record<string, unknown>[]
        }
        sinon.assert.match(results.count, 1)
        sinon.assert.match(results.total, 1)
        sinon.assert.match(results.transactions, sinon.match.array.and(sinon.match.has('length', 1)))
        sinon.assert.match(results.transactions[0], sinon.match.has('serviceExternalId', SERVICE_EXTERNAL_ID))
      })

      it('should set pagination on the context', () => {
        const context = mockResponse.args[0][3] as Record<string, unknown>
        const pagination = context.pagination as Record<string, number | Record<string, unknown>>
        sinon.assert.match(pagination, sinon.match.object)
      })
    })

    describe('with valid status filter', () => {
      it('should pass status filter to searchTransactions service', async () => {
        nextRequest({
          query: { state: 'in_progress' },
        })
        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.state.should.eql(['in_progress'])
        searchParams.paymentStates.should.eql(['CREATED', 'STARTED', 'CAPTURABLE', 'SUBMITTED'])
        expect(searchParams.refundStates).to.be.undefined
        expect(searchParams.disputeStates).to.be.undefined
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { state: 'in_progress' },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.state.should.eql(['in_progress'])
        context.filters.paymentStates.should.eql(['CREATED', 'STARTED', 'CAPTURABLE', 'SUBMITTED'])
        expect(context.filters.refundStates).to.be.undefined
        expect(context.filters.disputeStates).to.be.undefined
      })
    })

    describe('with valid date filter', () => {
      it('should pass date filter to searchTransactions service', async () => {
        nextRequest({
          query: { dateFilter: 'yesterday' },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.dateFilter.should.eql('yesterday')
        searchParams.fromDate.should.eql('2025-11-01T00:00:00.000+00:00')
        searchParams.toDate.should.eql('2025-11-01T23:59:59.999+00:00')
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { dateFilter: 'yesterday' },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.dateFilter.should.eql('yesterday')
        context.filters.fromDate.should.eql('2025-11-01T00:00:00.000+00:00')
        context.filters.toDate.should.eql('2025-11-01T23:59:59.999+00:00')
      })
    })

    describe('with a valid date range', () => {
      it('should correctly parse the date range and pass to searchTransactions', async () => {
        nextRequest({
          query: { dateFilter: 'custom-range', fromDate: '01/11/2025', toDate: '30/11/2025' },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.dateFilter.should.eql('custom-range')
        searchParams.fromDate.should.eql('2025-11-01T00:00:00.000+00:00')
        searchParams.toDate.should.eql('2025-11-30T23:59:59.999+00:00')
      })

      it('should include the filters in the context', async () => {
        nextRequest({
          query: { dateFilter: 'custom-range', fromDate: '01/11/2025', toDate: '30/11/2025' },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.dateFilter.should.eql('custom-range')
        context.filters.fromDate.should.eql('2025-11-01T00:00:00.000+00:00')
        context.filters.toDate.should.eql('2025-11-30T23:59:59.999+00:00')
      })
    })

    describe('with a valid time range', () => {
      it('should correctly parse the time range and pass to searchTransactions', async () => {
        nextRequest({
          query: {
            dateFilter: 'custom-range',
            fromDate: '01/11/2025',
            toDate: '30/11/2025',
            includeTime: 'include',
            fromTime: '9:30:00',
            toTime: '17:45:00',
          },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.fromDate.should.eql('2025-11-01T09:30:00.000+00:00')
        searchParams.toDate.should.eql('2025-11-30T17:45:00.000+00:00')
      })

      it('should include the filters in the context', async () => {
        nextRequest({
          query: {
            dateFilter: 'custom-range',
            fromDate: '01/11/2025',
            toDate: '30/11/2025',
            includeTime: 'include',
            fromTime: '9:30:00',
            toTime: '17:45:00',
          },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.includeTime.should.eql(true)
        searchParams.fromDate.should.eql('2025-11-01T09:30:00.000+00:00')
        searchParams.toDate.should.eql('2025-11-30T17:45:00.000+00:00')
      })
    })

    describe('with valid brand filter', () => {
      it('should pass brand filter to searchTransactions service', async () => {
        nextRequest({
          query: { brand: CARD_BRAND },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.brand.should.eql(CARD_BRAND)
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { brand: CARD_BRAND },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.brand.should.eql(CARD_BRAND)
      })
    })

    describe('with valid email filter', () => {
      it('should pass email filter to searchTransactions service', async () => {
        nextRequest({
          query: { email: EMAIL },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.email.should.eql(EMAIL)
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { email: EMAIL },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.email.should.eql(EMAIL)
      })
    })

    describe('with valid reference filter', () => {
      it('should pass reference filter to searchTransactions service', async () => {
        nextRequest({
          query: { reference: REFERENCE },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.reference.should.eql(REFERENCE)
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { reference: REFERENCE },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.reference.should.eql(REFERENCE)
      })
    })

    describe('with valid name filter', () => {
      it('should pass name filter to searchTransactions service', async () => {
        nextRequest({
          query: { cardholderName: CARDHOLDER_NAME },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.cardholderName.should.eql(CARDHOLDER_NAME)
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { cardholderName: CARDHOLDER_NAME },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.cardholderName.should.eql(CARDHOLDER_NAME)
      })
    })

    describe('with last 4 digits filter', () => {
      it('should pass last 4 digits filter to searchTransactions service', async () => {
        nextRequest({
          query: { lastDigitsCardNumber: LAST_DIGITS_CARD_NUMBER },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.lastDigitsCardNumber.should.eql(LAST_DIGITS_CARD_NUMBER)
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { lastDigitsCardNumber: LAST_DIGITS_CARD_NUMBER },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.lastDigitsCardNumber.should.eql(LAST_DIGITS_CARD_NUMBER)
      })
    })

    describe('with valid metadata filter', () => {
      it('should pass metadata filter to searchTransactions service', async () => {
        nextRequest({
          query: { metadataValue: METADATA_VALUE },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.metadataValue.should.eql(METADATA_VALUE)
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { metadataValue: METADATA_VALUE },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.metadataValue.should.eql(METADATA_VALUE)
      })
    })

    describe('with combined filters', () => {
      it('should pass multiple filters to searchAgreements service', async () => {
        nextRequest({
          query: {
            cardholderName: CARDHOLDER_NAME,
            brand: CARD_BRAND,
          },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.cardholderName.should.eql(CARDHOLDER_NAME)
        searchParams.brand.should.eql(CARD_BRAND)
      })

      it('should include both filters in context', async () => {
        nextRequest({
          query: {
            cardholderName: CARDHOLDER_NAME,
            brand: CARD_BRAND,
          },
        })

        await call('get')

        const context = mockResponse.args[0][3] as { filters: Record<string, object> }
        context.filters.cardholderName.should.eql(CARDHOLDER_NAME)
        context.filters.brand.should.eql(CARD_BRAND)
      })
    })

    describe('with page parameter', () => {
      it('should pass valid page number to searchTransactions service', async () => {
        nextRequest({
          query: { page: '2' },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.currentPage.should.eql(2)
      })

      it('should default to page 1 for invalid page parameter', async () => {
        nextRequest({
          query: { page: 'invalid' },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.currentPage.should.eql(1)
      })

      it('should default to page 1 for negative page number', async () => {
        nextRequest({
          query: { page: '-1' },
        })

        await call('get')

        mockLedgerService.searchTransactions.should.have.been.calledOnce

        const searchParams = mockLedgerService.searchTransactions.firstCall.args[0] as Record<string, object>
        searchParams.currentPage.should.eql(1)
      })
    })
  })
})
