import { expect } from 'chai'
import sinon from 'sinon'
import querystring from 'querystring'
import LedgerClient from '@services/clients/pay/LedgerClient.class'

describe('ledger.service - csvSearchUrl & logCsvFileStreamComplete', () => {
  let ledgerService: unknown
  let infoStub: sinon.SinonStub
  let getQueryStringStub: sinon.SinonStub
  let originalLoggerExport: unknown
  let originalQsExport: unknown

  beforeEach(() => {
    sinon.restore()

    const proto = (LedgerClient as unknown as { prototype: Record<string, unknown> }).prototype
    try {
      if (Object.prototype.hasOwnProperty.call(proto, 'reports')) {
        delete (proto as unknown as Record<string, unknown>).reports
      }
      if (Object.prototype.hasOwnProperty.call(proto, 'transactions')) {
        delete (proto as unknown as Record<string, unknown>).transactions
      }
    } catch {
      // ignore
    }
    Object.defineProperty(proto, 'reports', {
      get: () => ({}),
      configurable: true,
    })
    Object.defineProperty(proto, 'transactions', {
      get: () => ({}),
      configurable: true,
    })

    const loggerPath = require.resolve('../utils/logger')

    if (!require.cache[loggerPath]) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require(loggerPath)
    }
    originalLoggerExport = require.cache[loggerPath]?.exports
    infoStub = sinon.stub()

    // replace exported factory so ledger.service's logger uses our infoStub
    require.cache[loggerPath]!.exports = () => ({ info: infoStub })

    const qsHelperPath = require.resolve('@utils/simplified-account/get-query-string-for-params')
    if (!require.cache[qsHelperPath]) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      require(qsHelperPath)
    }
    originalQsExport = require.cache[qsHelperPath]?.exports
    getQueryStringStub = sinon.stub().returns('from_date=2025-01-01&to_date=2025-01-02&payment_states=success,failed')

    require.cache[qsHelperPath]!.exports = getQueryStringStub

    const ledgerServicePath = require.resolve('./ledger.service')

    if (require.cache[ledgerServicePath]) delete require.cache[ledgerServicePath]
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    ledgerService = require('./ledger.service')
  })

  afterEach(() => {
    sinon.restore()

    try {
      const loggerPath = require.resolve('../utils/logger')
      require.cache[loggerPath]!.exports = originalLoggerExport
    } catch {
      // ignore
    }
    try {
      const qsHelperPath = require.resolve('@utils/simplified-account/get-query-string-for-params')
      require.cache[qsHelperPath]!.exports = originalQsExport
    } catch {
      // ignore
    }

    // remove ledger.service from cache to avoid cross-test contamination
    try {
      const ledgerServicePath = require.resolve('./ledger.service')
      if (require.cache[ledgerServicePath]) delete require.cache[ledgerServicePath]
    } catch {
      // ignore
    }

    delete process.env.LEDGER_URL
  })

  it('csvSearchUrl - builds full URL with account ids and formatted filters', () => {
    process.env.LEDGER_URL = 'https://ledger.test'

    const filters = { fromDate: '2025-01-01', toDate: '2025-01-02', payment_states: ['success', 'failed'] }
    const csvSearchUrl = (ledgerService as { csvSearchUrl: (f: Record<string, unknown>, ids?: string[]) => string })
      .csvSearchUrl
    const url = csvSearchUrl(filters, ['10', '20'])

    expect(url.startsWith('https://ledger.test/v1/transaction?')).to.be.true

    const qsPart = url.split('?')[1] ?? ''
    const parsed = querystring.parse(qsPart)

    expect(parsed.account_id).to.equal('10,20')
    expect(qsPart).to.contain('from_date=2025-01-01')
    expect(qsPart).to.contain('to_date=2025-01-02')
    expect(qsPart).to.contain('payment_states=success,failed')

    expect(getQueryStringStub.calledOnce).to.be.true
  })

  it('csvSearchUrl - sad: propagates errors from getQueryStringForParams', () => {
    getQueryStringStub.throws(new Error('qs helper failure'))
    process.env.LEDGER_URL = 'https://ledger.test'

    const csvSearchUrl = (ledgerService as { csvSearchUrl: (f: Record<string, unknown>, ids?: string[]) => string })
      .csvSearchUrl
    try {
      csvSearchUrl({ any: 'val' }, ['1'])
      throw new Error('expected to throw')
    } catch (err: unknown) {
      expect(err).to.be.instanceOf(Error)
      expect((err as Error).message).to.equal('qs helper failure')
    }
  })

  it('csvSearchUrl - edge: empty filters and single account does not throw and includes account_id', () => {
    process.env.LEDGER_URL = 'https://ledger.test'

    getQueryStringStub.returns('')

    const csvSearchUrl = (ledgerService as { csvSearchUrl: (f: Record<string, unknown>, ids?: string[]) => string })
      .csvSearchUrl
    const url = csvSearchUrl({}, ['1'])
    const qsPart = url.split('?')[1] ?? ''
    const parsed = querystring.parse(qsPart)

    expect(parsed.account_id).to.equal('1')
    expect(url.startsWith('https://ledger.test/v1/transaction?')).to.be.true
  })

  it('logCsvFileStreamComplete - calls logger.info with expected metadata', () => {
    const timestampStart = Date.now() - 50
    const filters = { fromDate: 'a', toDate: 'b', payment_states: 'success' }
    const gatewayAccountIds = ['1', '2']
    const user = { numberOfLiveServices: 3 }
    const allServiceTransactions = true
    const liveAccounts = true

    const fn = (
      ledgerService as {
        logCsvFileStreamComplete: (
          ts: number,
          f: Record<string, unknown>,
          ids: string[],
          u: { numberOfLiveServices?: number },
          all: boolean,
          live: boolean
        ) => void
      }
    ).logCsvFileStreamComplete

    fn(timestampStart, filters, gatewayAccountIds, user, allServiceTransactions, liveAccounts)

    expect(infoStub.calledOnce).to.be.true
    const [msg, meta] = infoStub.firstCall.args as [string, Record<string, unknown>]
    expect(msg).to.equal('Completed file stream')
    expect(meta).to.be.an('object')
    expect(meta).to.have.property('time_taken').that.is.a('number')
    expect(meta.gateway_account_ids).to.deep.equal(gatewayAccountIds)
    expect(meta.multiple_accounts).to.equal(true)
    expect(meta.all_service_transactions).to.equal(allServiceTransactions)
    expect(meta.user_number_of_live_services).to.equal(user.numberOfLiveServices)
    expect(meta.is_live).to.equal(liveAccounts)
    expect(meta.filters).to.be.a('string').and.not.equal('')
  })

  it('logCsvFileStreamComplete - sad: if logger throws the error is propagated', () => {
    infoStub.throws(new Error('logger fail'))

    const timestampStart = Date.now() - 10
    const filters = {}
    const gatewayAccountIds: string[] = []
    const user = {}
    const allServiceTransactions = false
    const liveAccounts = false

    const fn = (
      ledgerService as {
        logCsvFileStreamComplete: (
          ts: number,
          f: Record<string, unknown>,
          ids: string[],
          u: Record<string, unknown>,
          all: boolean,
          live: boolean
        ) => void
      }
    ).logCsvFileStreamComplete

    try {
      fn(timestampStart, filters, gatewayAccountIds, user, allServiceTransactions, liveAccounts)
      throw new Error('expected to throw')
    } catch (err: unknown) {
      expect(err).to.be.instanceOf(Error)
      expect((err as Error).message).to.equal('logger fail')
    }
  })

  it('logCsvFileStreamComplete - edge: empty filters and single account logs empty filters string', () => {
    infoStub.resetHistory()
    const timestampStart = Date.now() - 5
    const filters = {}
    const gatewayAccountIds = ['1']
    const user = {}
    const allServiceTransactions = false
    const liveAccounts = false

    const fn = (
      ledgerService as {
        logCsvFileStreamComplete: (
          ts: number,
          f: Record<string, unknown>,
          ids: string[],
          u: Record<string, unknown>,
          all: boolean,
          live: boolean
        ) => void
      }
    ).logCsvFileStreamComplete

    fn(timestampStart, filters, gatewayAccountIds, user, allServiceTransactions, liveAccounts)

    expect(infoStub.calledOnce).to.be.true
    const [, meta] = infoStub.firstCall.args as [unknown, Record<string, unknown>]
    expect(meta.filters).to.equal('')
    expect(meta.multiple_accounts).to.equal(false)
    expect(meta.gateway_account_ids).to.deep.equal(gatewayAccountIds)
  })
})
