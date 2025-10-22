import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const SERVICE_EXTERNAL_ID = 'service123abc'
const TRANSACTION_EXTERNAL_ID = 'transaction123abc'
const GATEWAY_ACCOUNT_ID = 117
const PAGE_SIZE = 20
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
        gatewayTransactionId: '11933338-20de-4792-bbee-8d19258dabc3',
        reference: 'REF 123',
        state: {
          finished: true,
          code: 'P0010',
          message: 'Payment method rejected',
          status: 'declined',
        },
        amount: 145600,
        createdDate: '2025-09-12T11:47:32.980+01:00',
        email: 'pay-me@example.com',
        cardDetails: {
          cardBrand: 'Visa',
        },
      },
    ],
  }),
}

const { nextRequest, call } = new ControllerTestBuilder(
  '@controllers/simplified-account/services/transactions/transaction-list.controller'
)
  .withStubs({
    '@utils/response': { response: mockResponse },
    '@services/ledger.service': mockLedgerService,
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
