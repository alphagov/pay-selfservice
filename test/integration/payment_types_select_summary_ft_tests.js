var path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
var userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
var request = require('supertest')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var nock = require('nock')
var paths = require(path.join(__dirname, '/../../app/paths.js'))
var session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
var _ = require('lodash')
var {expect} = require('chai')

var NOT_AVAILABLE_BECAUSE_OF_TYPE_REQUIREMENT = 'Not available'
var NOT_AVAILABLE_BECAUSE_OF_3DS_REQUIREMENT = 'You must <a href=\'/3ds\'>enable 3D Secure</a> to accept Maestro'

var ACCOUNT_ID = 182364
var app
var requestId = 'unique-request-id'
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}

var CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
var CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
var CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = CONNECTOR_ACCOUNT_PATH + '/card-types'
var connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)

var buildAcceptedCardType = function (value, available = true, unavailabilityReason = '', selected = '') {
  return {
    'id': `payment-types-${value}-brand`,
    'value': value,
    'label': _.capitalize(value),
    'available': available,
    'unavailabilityReason': unavailabilityReason,
    'selected': selected
  }
}

var ALL_CARD_TYPES = {
  'card_types': [
    {'id': '1', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'CREDIT', 'requires3ds': false},
    {'id': '2', 'brand': 'mastercard', 'label': 'Mastercard', 'type': 'DEBIT', 'requires3ds': false},
    {'id': '3', 'brand': 'discover', 'label': 'Discover', 'type': 'CREDIT', 'requires3ds': false},
    {'id': '4', 'brand': 'maestro', 'label': 'Maestro', 'type': 'DEBIT', 'requires3ds': true}]
}

function buildGetRequest (path, baseApp) {
  return request(baseApp)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}

function mockConnectorAccountEndpoint (requires3ds = true, paymentProvider = 'worldpay') {
  connectorMock.get(CONNECTOR_ACCOUNT_PATH)
    .reply(200, {id: ACCOUNT_ID, payment_provider: paymentProvider, requires3ds: requires3ds})
}

function mockConnectorAllCardTypesEndpoint () {
  connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
    .reply(200, ALL_CARD_TYPES)
}

function mockConnectorAcceptedCardTypesEndpoint (acceptedCardTypes) {
  connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
    .reply(200, acceptedCardTypes)
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
        gateway_account_ids: [ACCOUNT_ID], permissions: [{name: permissions}]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should select all card types that have been previously accepted', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1', 'type': 'DEBIT'}, {'id': '2', 'type': 'CREDIT'}, {'id': '3', 'type': 'CREDIT'}, {'id': '4', 'type': 'DEBIT'}]})

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(200)
        .expect(response => {
          expect(response.body.isAcceptedTypeAll).to.be.true // eslint-disable-line
          expect(response.body.isAcceptedTypeDebit).to.be.false // eslint-disable-line
          expect(response.body.brands).to.be.deep.equal([
            buildAcceptedCardType('mastercard', true, '', 'checked'),
            buildAcceptedCardType('discover', true, '', 'checked'),
            buildAcceptedCardType('maestro', true, '', 'checked')
          ])
        })
        .end(done)
    })

    it('should select debit only card types that have been previously accepted', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '4', 'type': 'DEBIT'}]
      })

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(200)
        .expect(response => {
          expect(response.body.isAcceptedTypeAll).to.be.false // eslint-disable-line
          expect(response.body.isAcceptedTypeDebit).to.be.true // eslint-disable-line
          expect(response.body.brands).to.be.deep.equal([
            buildAcceptedCardType('mastercard', true, '', ''),
            buildAcceptedCardType('maestro', true, '', 'checked'),
            buildAcceptedCardType('discover', false, NOT_AVAILABLE_BECAUSE_OF_TYPE_REQUIREMENT, '')
          ])
        })
        .end(done)
    })

    it('should enable card types that require 3ds when 3ds is enabled on the account', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1', 'type': 'CREDIT'}, {'id': '2', 'type': 'DEBIT'}]})

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(200)
        .expect(response => {
          expect(response.body.brands).to.be.deep.equal([
            buildAcceptedCardType('mastercard', true, '', 'checked'),
            buildAcceptedCardType('discover', true, '', ''),
            buildAcceptedCardType('maestro', true, '', '')
          ])
        })
        .end(done)
    })

    it('should disable card types that require 3ds when 3ds is disabled on the account', function (done) {
      mockConnectorAccountEndpoint(false)
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1', 'type': 'CREDIT'}, {'id': '2', 'type': 'DEBIT'}]})

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(200)
        .expect(response => {
          expect(response.body.brands).to.be.deep.equal([
            buildAcceptedCardType('mastercard', true, '', 'checked'),
            buildAcceptedCardType('discover', true, '', ''),
            buildAcceptedCardType('maestro', false, NOT_AVAILABLE_BECAUSE_OF_3DS_REQUIREMENT, '')
          ])
        })
        .end(done)
    })

    it('should hide card types that require 3ds when 3ds is not supported on the account', function (done) {
      mockConnectorAccountEndpoint(false, 'smartpay')
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1', 'type': 'CREDIT'}, {'id': '2', 'type': 'DEBIT'}]})

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(200)
        .expect(response => {
          expect(response.body.brands).to.be.deep.equal([
            buildAcceptedCardType('mastercard', true, '', 'checked'),
            buildAcceptedCardType('discover', true, '', '')
          ])
        })
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      mockConnectorAllCardTypesEndpoint()
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.paymentTypes.summary, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if connector returns any other error while retrieving accepted card types', function (done) {
      mockConnectorAllCardTypesEndpoint()
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
