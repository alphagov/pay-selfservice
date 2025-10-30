import ControllerTestBuilder from '@test/test-helpers/simplified-account/controllers/ControllerTestBuilder.class'
import sinon from 'sinon'
import GatewayAccountType from '@models/gateway-account/gateway-account-type'

const SERVICE_EXTERNAL_ID = 'service123abc'
const GATEWAY_ACCOUNT_ID = 117

describe('controller: simplified-account/services/transactions/download-csv/transaction-download.controller', () => {
  let mockCsvSearchUrl: sinon.SinonStub
  let mockLogCsvFileStreamComplete: sinon.SinonStub
  let mockRenderErrorView: sinon.SinonStub
  let mockDateToDefaultFormat: sinon.SinonStub

  let lastRequestedUrl: string | undefined
  let triggerBehavior: 'success' | 'error' = 'success'

  const { nextRequest, nextResponse, call } = new ControllerTestBuilder(
    '@controllers/simplified-account/services/transactions/download-csv/transaction-download.controller'
  )
    .withStubs({
      '@utils/response': { renderErrorView: (mockRenderErrorView = sinon.stub()) },
      '@services/ledger.service': {
        csvSearchUrl: (mockCsvSearchUrl = sinon.stub().callsFake(() => 'http://csv.example/download')),
        logCsvFileStreamComplete: (mockLogCsvFileStreamComplete = sinon.stub()),
      },
      '@services/clients/stream.client': sinon
        .stub()
        .callsFake((onData: (chunk: Buffer) => void, onComplete: () => void, onError: () => void) => {
          return {
            request: (url: string) => {
              lastRequestedUrl = url
              if (triggerBehavior === 'success') {
                onData(Buffer.from('col1,col2\nrow1,row2\n'))
                onComplete()
              } else {
                onError()
              }
            },
          }
        }),
      '@utils/dates': { dateToDefaultFormat: (mockDateToDefaultFormat = sinon.stub().returns('2025-09-12 10:00:00')) },
    })
    .withServiceExternalId(SERVICE_EXTERNAL_ID)
    .withAccount({
      gateway_account_id: GATEWAY_ACCOUNT_ID,
      payment_provider: undefined,
      allow_moto: false,
      type: GatewayAccountType.TEST,
    })
    .withUrl(
      `https://wwww.payments.example.com/service/${SERVICE_EXTERNAL_ID}/account/${GatewayAccountType.TEST}/transactions/download`
    )
    .build()

  beforeEach(() => {
    sinon.resetHistory()
    lastRequestedUrl = undefined
    triggerBehavior = 'success'

    nextResponse({
      setHeader: sinon.stub(),
      write: sinon.stub(),
      end: sinon.stub(),
      locals: {},
    })

    // reset default stubs behaviour
    mockCsvSearchUrl.resetHistory()
    mockLogCsvFileStreamComplete.resetHistory()
    mockRenderErrorView.resetHistory()
    mockDateToDefaultFormat.resetHistory()
  })

  it('requests CSV url, streams data and logs completion', async () => {
    await call('get')

    sinon.assert.calledOnce(mockCsvSearchUrl)
    const csvArgs = mockCsvSearchUrl.args[0]
    sinon.assert.match(csvArgs[0], sinon.match.object)
    sinon.assert.match(csvArgs[1], [GATEWAY_ACCOUNT_ID])

    sinon.assert.match(lastRequestedUrl, 'http://csv.example/download')

    sinon.assert.calledOnce(mockLogCsvFileStreamComplete)
    const logArgs = mockLogCsvFileStreamComplete.args[0]
    sinon.assert.match(typeof logArgs[0], 'number')
    sinon.assert.match(logArgs[1], sinon.match.object)
    sinon.assert.match(logArgs[2], [GATEWAY_ACCOUNT_ID])
    sinon.assert.match(logArgs[3], sinon.match.object)
    sinon.assert.match(logArgs[4], false)
    sinon.assert.match(logArgs[5], false)
  })

  it('stream client error triggers renderErrorView', async () => {
    triggerBehavior = 'error'
    await call('get')

    sinon.assert.calledOnce(mockRenderErrorView)
    const renderArgs = mockRenderErrorView.args[0]
    sinon.assert.match(renderArgs[2], 'Unable to download list of transactions.')
    sinon.assert.notCalled(mockLogCsvFileStreamComplete)
  })

  it('edge: stripe provider adds feeHeaders to csv filters', async () => {
    nextRequest({
      account: {
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        payment_provider: 'stripe',
        allow_moto: false,
        type: GatewayAccountType.TEST,
      },
    })

    await call('get')

    sinon.assert.calledOnce(mockCsvSearchUrl)
    const filters = mockCsvSearchUrl.args[0][0] as Record<string, unknown>
    sinon.assert.match(filters.feeHeaders, true)
  })

  it('allow_moto sets motoHeader true in filters', async () => {
    nextRequest({
      account: {
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        payment_provider: undefined,
        allow_moto: true,
        type: GatewayAccountType.TEST,
      },
    })

    await call('get')

    sinon.assert.calledOnce(mockCsvSearchUrl)
    const filters = mockCsvSearchUrl.args[0][0] as Record<string, unknown>
    sinon.assert.match(filters.motoHeader, true)
  })

  it('live account causes logCsvFileStreamComplete live flag to be true', async () => {
    nextRequest({
      account: {
        gateway_account_id: GATEWAY_ACCOUNT_ID,
        payment_provider: undefined,
        allow_moto: false,
        type: 'live',
      },
    })

    await call('get')

    sinon.assert.calledOnce(mockLogCsvFileStreamComplete)
    const logArgs = mockLogCsvFileStreamComplete.args[0]
    sinon.assert.match(logArgs[5], true)
  })
})
