'use strict'

// NPM modules
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const request = require('supertest')
const nock = require('nock')

// Local modules
require('../test-helpers/serialize-mock')
const userCreator = require('../test-helpers/user-creator')
const getApp = require('../../server').getApp
const paths = require('../../app/paths')
const session = require('../test-helpers/mock-session')
const getQueryStringForParams = require('../../app/utils/get-query-string-for-params')

// Setup
const gatewayAccountId = '651342'
const ledgerSearchParameters = {}
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + gatewayAccountId
const LEDGER_TRANSACTION_PATH = '/v1/transaction?account_id=' + gatewayAccountId
const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: { 'x-request-id': requestId }
}
const connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)
const ledgerMock = nock(process.env.LEDGER_URL, aCorrelationHeader)

chai.use(chaiAsPromised)
chai.should()
let app

function ledgerMockResponds (code, data, searchParameters) {
  const queryString = getQueryStringForParams(searchParameters)
  return ledgerMock.get(LEDGER_TRANSACTION_PATH + '&' + queryString)
    .reply(code, data)
}

function getTransactionList () {
  return request(app)
    .get(paths.transactions.index)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}

describe('The /transactions endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    const permissions = 'transactions:read'
    const user = session.getUser({
      gateway_account_ids: [gatewayAccountId],
      permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'sandbox',
        'gateway_account_id': gatewayAccountId,
        'credentials': { 'username': 'a-username' }
      })
  })

  it('should show error message on a bad request while retrieving the list of transactions', function (done) {
    const errorMessage = 'There is a problem with the payments platform. Please contact the support team.'
    ledgerMockResponds(400, { 'message': errorMessage }, ledgerSearchParameters)

    getTransactionList()
      .expect(500, { 'message': errorMessage })
      .end(done)
  })

  it('should show a generic error message on a ledger service error while retrieving the list of transactions', function (done) {
    ledgerMockResponds(500, { 'message': 'some error from connector' }, ledgerSearchParameters)

    getTransactionList()
      .expect(500, { 'message': 'There is a problem with the payments platform. Please contact the support team.' })
      .end(done)
  })

  it('should show internal error message if any error happens while retrieving the list of transactions', function (done) {
    // No ledgerMock defined on purpose to mock a network failure

    getTransactionList()
      .expect(500, { 'message': 'There is a problem with the payments platform. Please contact the support team.' })
      .end(done)
  })
})
