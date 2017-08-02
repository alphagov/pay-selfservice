var path = require('path')
var userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
var request = require('supertest')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var nock = require('nock')
var csrf = require('csrf')
var paths = require(path.join(__dirname, '/../../app/paths.js'))
var session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
var expect = require('chai').expect
var _ = require('lodash')

var requestId = 'unique-request-id'
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}
var {TYPES} = require(path.join(__dirname, '/../../app/controllers/payment_types_controller.js'))
var ACCOUNT_ID = 182364
var app
var CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
var CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
var CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID + '/card-types'

var NOT_AVAILABLE_BECAUSE_OF_TYPE_REQUIREMENT = 'Not available'
var NOT_AVAILABLE_BECAUSE_OF_3DS_REQUIREMENT = 'You must <a href=\'/3ds\'>enable 3D Secure</a> to accept Maestro'

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

function buildGetRequest (path, app) {
  return request(app)
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

function buildFormPostRequest (path, sendData, sendCSRF, app) {
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF
  if (sendCSRF) {
    sendData.csrfToken = csrf().create('123')
  }
  return request(app)
    .post(path)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('x-request-id', requestId)
    .send(sendData)
}

describe('The payment types endpoint,', function () {
  describe('render select brand view,', function () {
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

    it('should show all debit and credit card options if accepted type is debit and credit cards', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1'}]
      })

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL', app)
        .expect(200)
        .expect(response => {
          expect(response.body.acceptedType).to.equal('ALL')
        })
        .end(done)
    })

    it('should show debit card options only if accepted type is debit cards only', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1'}]
      })

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=DEBIT', app)
        .expect(200)
        .expect(response => {
          expect(response.body.acceptedType).to.equal('DEBIT')
        })
        .end(done)
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

    it('should select debit onlyonly card types that have been previously accepted', function (done) {
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
        'card_types': [{'id': '1', 'type': 'CREDIT'}, {
          'id': '2',
          'type': 'DEBIT'
        }]
      })

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
        'card_types': [{'id': '1', 'type': 'CREDIT'}, {
          'id': '2',
          'type': 'DEBIT'
        }]
      })

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

    it('should select all the options by default none has been previously accepted', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': []
      })

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL', app)
        .expect(200)
        .expect(response => {
          expect(response.body.brands).to.be.deep.equal([
            buildAcceptedCardType('mastercard', true, '', 'checked'),
            buildAcceptedCardType('discover', true, '', 'checked'),
            buildAcceptedCardType('maestro', true, '', 'checked')
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

    it('should show the error if provided', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      mockConnectorAcceptedCardTypesEndpoint({
        'card_types': [{'id': '1'}]
      })

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL&error=Error', app)
        .expect(200)
        .expect(response => {
          expect(response.body.error).to.equal('Error')
        })
        .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(404, {
          'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
        })

      buildGetRequest(paths.paymentTypes.selectBrand, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if connector returns any other error while retrieving accepted card types', function (done) {
      mockConnectorAccountEndpoint()
      mockConnectorAllCardTypesEndpoint()
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildGetRequest(paths.paymentTypes.selectBrand, app)
        .expect(500, {'message': 'Unable to retrieve accepted card types for the account.'})
        .end(done)
    })

    it('should display an error if connector returns any other error while retrieving all card types', function (done) {
      mockConnectorAccountEndpoint()
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {'card_types': []})
        .reply(200, {})

      buildGetRequest(paths.paymentTypes.selectBrand, app)
        .expect(500, {'message': 'Unable to retrieve card types.'})
        .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
      // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(paths.paymentTypes.selectBrand, app)
        .expect(500, {'message': 'Internal server error'})
        .end(done)
    })
  })

  describe('submit select brand view,', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'payment-types:update'
      var user = session.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [{name: permissions}]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should post debit and credit card options if accepted type is debit and credit cards', function (done) {
      mockConnectorAllCardTypesEndpoint()
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        'card_types': ['1', '2', '3', '4']
      })
        .reply(200, {})

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.ALL,
        'acceptedBrands': ['mastercard', 'discover', 'maestro']
      }, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) {
            done(err)
          }
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + '?acceptedType=ALL')
          done()
        })
    })

    it('should post debit card options only if accepted type is debit only', function (done) {
      mockConnectorAllCardTypesEndpoint()
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        'card_types': ['2', '4']
      })
        .reply(200, {})

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.DEBIT,
        'acceptedBrands': ['mastercard', 'discover', 'maestro']
      }, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) {
            done(err)
          }
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + '?acceptedType=DEBIT')
          done()
        })
    })

    it('should not post any card option that is unknown', function (done) {
      mockConnectorAllCardTypesEndpoint()
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        'card_types': ['3']
      })
        .reply(200, {})

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.ALL,
        'acceptedBrands': ['discover', 'unknown']
      }, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) {
            done(err)
          }
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + '?acceptedType=ALL')
          done()
        })
    })

    it('should show an error if no card option selected', function (done) {
      mockConnectorAllCardTypesEndpoint()

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.ALL,
        'acceptedBrands': []
      }, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) {
            done(err)
          }
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.selectBrand + '?acceptedType=ALL&error=You%20must%20choose%20to%20accept%20at%20least%20one%20card%20brand%20to%20continue')
          done()
        })
    })

    it('should display an error if connector returns any other error while retrieving card types', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.ALL,
        'acceptedBrands': ['discover', 'unknown']
      }, true, app)
        .expect(500, {'message': 'Unable to retrieve card types.'})
        .end(done)
    })

    it('should display an error if connector returns any other error while posting accepted card types', function (done) {
      mockConnectorAllCardTypesEndpoint()
      connectorMock.post(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH, {
        'card_types': ['3']
      })
        .reply(999, {
          'message': 'Some error in Connector'
        })

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.ALL,
        'acceptedBrands': ['discover', 'unknown']
      }, true, app)
        .expect(500, {'message': 'Unable to save accepted card types.'})
        .end(done)
    })
  })
})
