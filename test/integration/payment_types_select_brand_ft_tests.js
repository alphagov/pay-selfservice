const path = require('path')
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const nock = require('nock')
const csrf = require('csrf')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const expect = require('chai').expect
const _ = require('lodash')

const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}
const {TYPES} = require(path.join(__dirname, '/../../app/controllers/payment_types_controller.js'))
const ACCOUNT_ID = 182364
let app
const CONNECTOR_ALL_CARD_TYPES_API_PATH = '/v1/api/card-types'
const CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID + '/card-types'

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

function buildGetRequest (path, app) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
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
        gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should show all debit and credit card options if accepted type is debit and credit cards', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'id': '1'}]
        })

      var expectedData = {
        acceptedType: 'ALL',
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType('mastercard', true, 'checked'),
          buildAcceptedCardType('discover', true),
          buildAcceptedCardType('maestro', true)
        ],
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL', app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should show debit card options only if accepted type is debit cards only', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'id': '1'}]
        })

      var expectedData = {
        acceptedType: 'DEBIT',
        isAcceptedTypeAll: false,
        isAcceptedTypeDebit: true,
        brands: [
          buildAcceptedCardType('mastercard', true, 'checked'),
          buildAcceptedCardType('maestro', true),
          buildAcceptedCardType('discover', false)
        ],
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=DEBIT', app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should select all the options that have been previously accepted', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'id': '1'}, {'id': '3'}, {'id': '4'}]
        })

      var expectedData = {
        acceptedType: 'ALL',
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType('mastercard', true, 'checked'),
          buildAcceptedCardType('discover', true, 'checked'),
          buildAcceptedCardType('maestro', true, 'checked')
        ],
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL', app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should select all the options by default none has been previously accepted', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': []
        })

      var expectedData = {
        acceptedType: 'ALL',
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        brands: [
          buildAcceptedCardType('mastercard', true, 'checked'),
          buildAcceptedCardType('discover', true, 'checked'),
          buildAcceptedCardType('maestro', true, 'checked')
        ],
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL', app)
        .expect(200, expectedData)
        .end(done)
    })

    it('should show the error if provided', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
      connectorMock.get(CONNECTOR_ACCEPTED_CARD_TYPES_FRONTEND_PATH)
        .reply(200, {
          'card_types': [{'id': '1'}]
        })

      var expectedData = {
        acceptedType: 'ALL',
        isAcceptedTypeAll: true,
        isAcceptedTypeDebit: false,
        error: 'Error',
        brands: [
          buildAcceptedCardType('mastercard', true, 'checked'),
          buildAcceptedCardType('discover', true),
          buildAcceptedCardType('maestro', true)
        ],
        permissions: {
          'payment_types_read': true
        },
        navigation: true
      }

      buildGetRequest(paths.paymentTypes.selectBrand + '?acceptedType=ALL&error=Error', app)
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

      buildGetRequest(paths.paymentTypes.selectBrand, app)
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

      buildGetRequest(paths.paymentTypes.selectBrand, app)
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
        gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should post debit and credit card options if accepted type is debit and credit cards', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
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
          if (err) done(err)
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + '?acceptedType=ALL')
          done()
        })
    })

    it('should post debit card options only if accepted type is debit only', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
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
          if (err) done(err)
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + '?acceptedType=DEBIT')
          done()
        })
    })

    it('should not post any card option that is unknown', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
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
          if (err) done(err)
          expect(res.headers.location).to.deep.equal(paths.paymentTypes.summary + '?acceptedType=ALL')
          done()
        })
    })

    it('should show an error if no card option selected', function (done) {
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)

      buildFormPostRequest(paths.paymentTypes.selectBrand, {
        'acceptedType': TYPES.ALL,
        'acceptedBrands': []
      }, true, app)
        .expect(303)
        .end(function (err, res) {
          if (err) done(err)
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
      connectorMock.get(CONNECTOR_ALL_CARD_TYPES_API_PATH)
        .reply(200, ALL_CARD_TYPES)
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
