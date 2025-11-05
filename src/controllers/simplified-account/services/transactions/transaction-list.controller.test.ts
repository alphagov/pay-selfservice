import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'
import { DateTime } from 'luxon'

const SERVICE_EXTERNAL_ID = 'service123abc'
const TRANSACTION_EXTERNAL_ID = 'transaction123abc'
const GATEWAY_ACCOUNT_ID = 117
const PAGE_SIZE = 20
const CARDHOLDER_NAME = 'Sam Holder'
const EMAIL = 'sam_holder@example.com'
const LAST_DIGITS_CARD_NUMBER = '1234'
const METADATA_VALUE = 'order-5678'
const CARD_BRAND = 'visa'
const REFERENCE = 'REF 123'
const NOW_DATE_TIME = '2025-09-12T11:47:32.980Z'
const mockResponse = sinon.stub()
const mockLedgerService = {
  searchTransactions: sinon.stub().resolves({
    total: 1,
    count: 1,
    page: 1,
    transactions: [
      {
        gatewayAccountId: GATEWAY_ACCOUNT_ID,
        serviceExternalId: SERVICE_EXTERNAL_ID,
        externalId: TRANSACTION_EXTERNAL_ID,
        transactionType: 'PAYMENT',
        gatewayTransactionId: '11933338-20de-4792-bbee-8d19258dabc3',
        reference: REFERENCE,
        state: {
          finished: true,
          code: 'P0010',
          message: 'Payment method rejected',
          status: 'declined',
        },
        amount: 145600,
        createdDate: '2025-09-12T11:47:32.980+01:00',
        email: EMAIL,
        cardDetails: {
          cardBrand: 'Visa',
        },
      },
    ],
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
    '@services/ledger.service': mockLedgerService,
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
          transactions: { link: string;[key: string]: unknown }[]
        }
        sinon.assert.match(results.count, 1)
        sinon.assert.match(results.total, 1)
        sinon.assert.match(results.transactions, sinon.match.array.and(sinon.match.has('length', 1)))
        sinon.assert.match(results.transactions[0], sinon.match.has('link', sinon.match.string))
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
          query: { state: 'In progress' },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          {
            state: 'In progress',
            paymentStates: ['created', 'started', 'capturable', 'submitted'],
            refundStates: undefined,
            disputeStates: undefined,
          }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { state: 'In progress' },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, {
          state: 'In progress',
          paymentStates: ['created', 'started', 'capturable', 'submitted'],
          refundStates: undefined,
          disputeStates: undefined,
        })
      })
    })

    describe('with valid date filter', () => {
      it('should pass date filter to searchTransactions service', async () => {
        nextRequest({
          query: { dateFilter: 'yesterday' },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          {
            dateFilter: 'yesterday',
            fromDate: DateTime.fromISO(NOW_DATE_TIME).minus({ days: 1 }).startOf('day').toISO(),
            toDate: DateTime.fromISO(NOW_DATE_TIME).minus({ days: 1 }).endOf('day').toISO(),
          }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { dateFilter: 'yesterday' },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, {
          dateFilter: 'yesterday',
          fromDate: DateTime.fromISO(NOW_DATE_TIME).minus({ days: 1 }).startOf('day').toISO(),
          toDate: DateTime.fromISO(NOW_DATE_TIME).minus({ days: 1 }).endOf('day').toISO(),
        })
      })
    })

    describe('with valid brand filter', () => {
      it('should pass brand filter to searchTransactions service', async () => {
        nextRequest({
          query: { brand: CARD_BRAND },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          { brand: CARD_BRAND }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { brand: CARD_BRAND },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { brand: CARD_BRAND })
      })
    })

    describe('with valid email filter', () => {
      it('should pass email filter to searchTransactions service', async () => {
        nextRequest({
          query: { email: EMAIL },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          { email: EMAIL }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { email: EMAIL },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { email: EMAIL })
      })
    })

    describe('with valid reference filter', () => {
      it('should pass reference filter to searchTransactions service', async () => {
        nextRequest({
          query: { reference: REFERENCE },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          { reference: REFERENCE }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { reference: REFERENCE },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { reference: REFERENCE })
      })
    })

    describe('with valid name filter', () => {
      it('should pass name filter to searchTransactions service', async () => {
        nextRequest({
          query: { cardholderName: CARDHOLDER_NAME },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          { cardholderName: CARDHOLDER_NAME }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { cardholderName: CARDHOLDER_NAME },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { cardholderName: CARDHOLDER_NAME })
      })
    })

    describe('with last 4 digits filter', () => {
      it('should pass last 4 digits filter to searchTransactions service', async () => {
        nextRequest({
          query: { lastDigitsCardNumber: LAST_DIGITS_CARD_NUMBER },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          { lastDigitsCardNumber: LAST_DIGITS_CARD_NUMBER }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { lastDigitsCardNumber: LAST_DIGITS_CARD_NUMBER },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { lastDigitsCardNumber: LAST_DIGITS_CARD_NUMBER })
      })
    })

    describe('with valid metadata filter', () => {
      it('should pass metadata filter to searchTransactions service', async () => {
        nextRequest({
          query: { metadataValue: METADATA_VALUE },
        })

        await call('get')

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          { metadataValue: METADATA_VALUE }
        )
      })

      it('should include filters in context', async () => {
        nextRequest({
          query: { metadataValue: METADATA_VALUE },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, { metadataValue: METADATA_VALUE })
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

        sinon.assert.calledWith(
          mockLedgerService.searchTransactions,
          GATEWAY_ACCOUNT_ID,
          1,
          PAGE_SIZE,

          {
            cardholderName: CARDHOLDER_NAME,
            brand: CARD_BRAND,
          }
        )
      })

      it('should include both filters in context', async () => {
        nextRequest({
          query: {
            cardholderName: CARDHOLDER_NAME,
            brand: CARD_BRAND,
          },
        })

        await call('get')

        const context = mockResponse.args[0][3] as Record<string, unknown>
        sinon.assert.match(context.filters, {
          cardholderName: CARDHOLDER_NAME,
          brand: CARD_BRAND,
        })
      })
    })

    describe('with page parameter', () => {
      it('should pass valid page number to searchTransactions service', async () => {
        nextRequest({
          query: { page: '2' },
        })

        await call('get')

        sinon.assert.calledWith(mockLedgerService.searchTransactions, GATEWAY_ACCOUNT_ID, 2, PAGE_SIZE)
      })

      it('should default to page 1 for invalid page parameter', async () => {
        nextRequest({
          query: { page: 'invalid' },
        })

        await call('get')

        sinon.assert.calledWith(mockLedgerService.searchTransactions, GATEWAY_ACCOUNT_ID, 1, PAGE_SIZE)
      })

      it('should default to page 1 for negative page number', async () => {
        nextRequest({
          query: { page: '-1' },
        })

        await call('get')

        sinon.assert.calledWith(mockLedgerService.searchTransactions, GATEWAY_ACCOUNT_ID, 1, PAGE_SIZE)
      })
    })
  })
})
