const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const nock = require('nock')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const _ = require('lodash')

const ACCOUNT_ID = 182364
let app
const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}

const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
const CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
const CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + '/card-types'
const connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)

var buildAcceptedCardType = function (value, available = true, selected = '') {
  return {
    'id': `payment-types-${value}-brand`,
    'value': value,
    'label': _.capitalize(value),
    'available': available,
    'selected': selected
  }
}

var ALL_CARD_TYPES = {
  'card_types': [
    {'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT'},
    {'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT'},
    {'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT'},
    {'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT'}]
}

function buildGetRequest (path, baseApp) {
  return request(baseApp)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}

describe('The payment types endpoint,', function () {
  describe('render summary view,', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'payment-types:read'
      var user = session.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should show all the card type options that have been previously accepted', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'id': '1'}, {'id': '3'}, {'id': '4'}]
        })

      var expectedData = {
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType('mastercard', true, 'checked'),
          buildAcceptedCardType('discover', true, 'checked'),
          buildAcceptedCardType('maestro', true, 'checked')
        ],
        'permissions': {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if connector returns any other error while retrieving accepted card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if connector returns any other error while retrieving all card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {'card_types': []})
        .reply(200, {})

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(500, {'message': 'Unable to retrieve card types.'})
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(500, {'message': 'Internal server error'})
        .end(done)
    })
  })
})
