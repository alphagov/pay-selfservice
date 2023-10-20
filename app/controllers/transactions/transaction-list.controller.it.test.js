'use strict'

const nock = require('nock')
const sinon = require('sinon')

const paths = require('../../paths')
const getQueryStringForParams = require('../../utils/get-query-string-for-params')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../../test/fixtures/gateway-account.fixtures')
const transactionListController = require('./transaction-list.controller')

// Setup
const gatewayAccountId = '651342'
const ledgerSearchParameters = {}
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const LEDGER_TRANSACTION_PATH = '/v1/transaction?account_id=' + gatewayAccountId
const requestId = 'unique-request-id'
const headers = { 'x-request-id': requestId }
const ledgerMock = nock(process.env.LEDGER_URL, { reqheaders: headers })

function ledgerMockResponds (code, data, searchParameters) {
  const queryString = getQueryStringForParams(searchParameters)
  return ledgerMock.get(LEDGER_TRANSACTION_PATH + '&' + queryString)
    .reply(code, data)
}

describe('The /transactions endpoint', () => {
  const account = validGatewayAccountResponse(
    {
      external_id: EXTERNAL_GATEWAY_ACCOUNT_ID,
      gateway_account_id: gatewayAccountId,
      payment_provider: 'sandbox',
      credentials: { 'username': 'a-username' }
    }
  )
  const req = {
    account,
    headers,
    session: {},
    url: formatAccountPathsFor(paths.account.transactions.index, EXTERNAL_GATEWAY_ACCOUNT_ID)
  }
  const res = {}
  let next

  afterEach(() => {
    nock.cleanAll()
  })

  beforeEach(() => {
    next = sinon.spy()
  })

  describe('Error getting transactions', () => {
    it('should show error message on a bad request while retrieving the list of transactions', async () => {
      const errorMessage = 'There is a problem with the payments platform. Please contact the support team.'
      ledgerMockResponds(400, { 'message': errorMessage }, ledgerSearchParameters)

      await transactionListController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Unable to retrieve list of transactions or card types'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should show a generic error message on a ledger service error while retrieving the list of transactions', async () => {
      ledgerMockResponds(500, { 'message': 'some error from connector' }, ledgerSearchParameters)

      await transactionListController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Unable to retrieve list of transactions or card types'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should show a gateway timeout message while retrieving the list of transactions', async () => {
      ledgerMockResponds(504,
        { 'message': 'Gateway Timeout' },
        ledgerSearchParameters)

      await transactionListController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Your request has timed out. Please apply more filters and try again'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should show internal error message if any error happens while retrieving the list of transactions', async () => {
      // No ledgerMock defined on purpose to mock a network failure

      await transactionListController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Unable to retrieve list of transactions or card types'))
      sinon.assert.calledWith(next, expectedError)
    })
  })

  describe('Pagination', () => {
    it('should return return error if page out of bounds', async () => {
      const reqWithInvalidPage = {
        ...req,
        query: {
          page: '-1'
        },
        url: formatAccountPathsFor(paths.account.transactions.index, EXTERNAL_GATEWAY_ACCOUNT_ID) + '?page=-1'
      }

      await transactionListController(reqWithInvalidPage, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Invalid search'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should return return error if pageSize out of bounds 1', async () => {
      const reqWithInvalidPageSize = {
        ...req,
        query: {
          pageSize: '600'
        },
        url: formatAccountPathsFor(paths.account.transactions.index, EXTERNAL_GATEWAY_ACCOUNT_ID) + '?pageSize=600'
      }

      await transactionListController(reqWithInvalidPageSize, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Invalid search'))
      sinon.assert.calledWith(next, expectedError)
    })

    it('should return return error if pageSize out of bounds 2', async () => {
      const reqWithInvalidPageSize = {
        ...req,
        query: {
          pageSize: '0'
        },
        url: formatAccountPathsFor(paths.account.transactions.index, EXTERNAL_GATEWAY_ACCOUNT_ID) + '?pageSize=0'
      }

      await transactionListController(reqWithInvalidPageSize, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Invalid search'))
      sinon.assert.calledWith(next, expectedError)
    })
  })
})
