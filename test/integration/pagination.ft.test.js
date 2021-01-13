'use strict'

const nock = require('nock')
const querystring = require('querystring')
const request = require('supertest')

require('../test-helpers/serialize-mock.js')
const userCreator = require('../test-helpers/user-creator.js')
const getApp = require('../../server.js').getApp
const paths = require('../../app/paths.js')
const session = require('../test-helpers/mock-session.js')
const gatewayAccountFixtures = require('../fixtures/gateway-account.fixtures')

let app

const gatewayAccountId = '452345'

const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + gatewayAccountId
const connectorMock = nock(process.env.CONNECTOR_URL)

const ALL_CARD_TYPES = {
  'card_types': [
    { 'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT' },
    { 'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT' },
    { 'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT' },
    { 'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT' }]
}

function searchTransactions (data) {
  let query = querystring.stringify(data)

  return request(app)
    .get(paths.transactions.index + '?' + query)
    .set('Accept', 'application/json')
    .send()
}

describe('Pagination', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'transactions:read'
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200,
        gatewayAccountFixtures.validGatewayAccountResponse({
          gateway_account_id: gatewayAccountId
        }))
    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)
  })

  describe('Pagination', function () {
    it('should return return error if page out of bounds', function (done) {
      let data = { 'page': -1 }

      searchTransactions(data)
        .expect(500, { 'message': 'Invalid search' }).end(done)
    })

    it('should return return error if pageSize out of bounds 1', function (done) {
      let data = { 'pageSize': 600 }

      searchTransactions(data)
        .expect(500, { 'message': 'Invalid search' }).end(done)
    })

    it('should return return error if pageSize out of bounds 2', function (done) {
      let data = { 'pageSize': 0 }

      searchTransactions(data)
        .expect(500, { 'message': 'Invalid search' }).end(done)
    })
  })
})
