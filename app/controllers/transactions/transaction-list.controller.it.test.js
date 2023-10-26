'use strict'

const sinon = require('sinon')
const paths = require('../../paths')
const formatAccountPathsFor = require('../../utils/format-account-paths-for')
const { validGatewayAccountResponse } = require('../../../test/fixtures/gateway-account.fixtures')
const transactionListController = require('./transaction-list.controller')

// Setup
const gatewayAccountId = '651342'
const EXTERNAL_GATEWAY_ACCOUNT_ID = 'an-external-id'
const requestId = 'unique-request-id'
const headers = { 'x-request-id': requestId }

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

  beforeEach(() => {
    next = sinon.spy()
  })

  describe('Error getting transactions', () => {
    it('should show internal error message if any error happens while retrieving the list of transactions', async () => {
      // No mocking defined on purpose to mock a network failure,
      // This integration test will cover server errors outside the 500 and 504 defined in the Cypress test
      await transactionListController(req, res, next)
      const expectedError = sinon.match.instanceOf(Error)
        .and(sinon.match.has('message', 'Unable to retrieve list of transactions or card types.'))
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
