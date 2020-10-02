'use strict'

const path = require('path')
require(path.join(__dirname, '/../test-helpers/serialize-mock.js'))
const userCreator = require(path.join(__dirname, '/../test-helpers/user-creator.js'))
const request = require('supertest')
const nock = require('nock')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test-helpers/mock-session.js'))
const querystring = require('querystring')
let app

const gatewayAccountId = '452345'

const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
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

describe('Pagination', () => {
  afterEach(() => {
    nock.cleanAll()
    app = null
  })

  beforeEach(done => {
    let permissions = 'transactions:read'
    var user = session.getUser({
      gateway_account_ids: [gatewayAccountId], permissions: [{ name: permissions }]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)

    connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
      .reply(200, ALL_CARD_TYPES)
  })

  describe('Pagination', () => {
    it('should return return error if page out of bounds', done => {
      let data = { 'page': -1 }

      searchTransactions(data)
        .expect(500, { 'message': 'Invalid search' }).end(done)
    })

    it(
      'should return return error if pageSize out of bounds 1',
      done => {
        let data = { 'pageSize': 600 }

        searchTransactions(data)
          .expect(500, { 'message': 'Invalid search' }).end(done)
      }
    )

    it(
      'should return return error if pageSize out of bounds 2',
      done => {
        let data = { 'pageSize': 0 }

        searchTransactions(data)
          .expect(500, { 'message': 'Invalid search' }).end(done)
      }
    )
  })
})
