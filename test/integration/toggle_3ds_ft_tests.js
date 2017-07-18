var path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
var userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
var request = require('supertest')
var getApp = require(path.join(__dirname, '/../../server.js')).getApp
var nock = require('nock')
var paths = require(path.join(__dirname, '/../../app/paths.js'))
var session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
var csrf = require('csrf')

var ACCOUNT_ID = 182364

var app

var requestId = 'unique-request-id'
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}

var CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
var CONNECTOR_TOGGLE_3DS_PATH = CONNECTOR_ACCOUNT_PATH + '/3ds-toggle'
var connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)

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

describe('The 3D Secure index endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'toggle-3ds:read'
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should not support 3D Secure for payment providers that are not Worldpay', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .times(2)
      .reply(200, {
        'payment_provider': 'sandbox',
        'requires3ds': false
      })

    var expectedData = {
      supports3ds: false,
      requires3ds: false,
      justToggled: false,
      permissions: {
        'toggle_3ds_read': true
      },
      navigation: true,
      currentGatewayAccount: {
        'payment_provider': 'sandbox',
        'requires3ds': false
      }
    }

    buildGetRequest(paths.toggle3ds.index, app)
      .expect(200, expectedData)
      .end(done)
  })

  it('should display if 3D Secure is on', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        'payment_provider': 'worldpay',
        'requires3ds': true
      })

    var expectedData = {
      supports3ds: true,
      requires3ds: true,
      justToggled: false,
      permissions: {
        'toggle_3ds_read': true
      },
      navigation: true,
      currentGatewayAccount: {
        'payment_provider': 'worldpay',
        'requires3ds': true
      }
    }

    buildGetRequest(paths.toggle3ds.index, app)
      .expect(200, expectedData)
      .end(done)
  })

  it('should display if 3D Secure is on and has just been toggled', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .times(2)
      .reply(200, {
        'payment_provider': 'worldpay',
        'requires3ds': true
      })

    var expectedData = {
      supports3ds: true,
      requires3ds: true,
      justToggled: true,
      permissions: {
        'toggle_3ds_read': true
      },
      navigation: true,
      currentGatewayAccount: {
        'payment_provider': 'worldpay',
        'requires3ds': true
      }
    }

    buildGetRequest(paths.toggle3ds.index + '?toggled', app)
      .expect(200, expectedData)
      .end(done)
  })

  it('should display if 3D Secure is off', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
       .reply(200, {
         'payment_provider': 'worldpay',
         'requires3ds': false
       })

    var expectedData = {
      supports3ds: true,
      requires3ds: false,
      justToggled: false,
      permissions: {
        'toggle_3ds_read': true
      },
      navigation: true,
      currentGatewayAccount: {
        'payment_provider': 'worldpay',
        'requires3ds': false
      }
    }

    buildGetRequest(paths.toggle3ds.index, app)
       .expect(200, expectedData)
       .end(done)
  })

  it('should display if 3D Secure is off and has just been toggled', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
       .reply(200, {
         'payment_provider': 'worldpay',
         'requires3ds': false
       })

    var expectedData = {
      supports3ds: true,
      requires3ds: false,
      justToggled: true,
      permissions: {
        'toggle_3ds_read': true
      },
      navigation: true,
      currentGatewayAccount: {
        'payment_provider': 'worldpay',
        'requires3ds': false
      }
    }

    buildGetRequest(paths.toggle3ds.index + '?toggled', app)
       .expect(200, expectedData)
       .end(done)
  })

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      })

    buildGetRequest(paths.toggle3ds.index, app)
      .expect(500, {'message': 'Unable to retrieve the 3D Secure setting.'})
      .end(done)
  })

  it('should display an error if connector returns any other error', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        'message': 'Some error in Connector'
      })

    buildGetRequest(paths.toggle3ds.index, app)
      .expect(500, {'message': 'Unable to retrieve the 3D Secure setting.'})
      .end(done)
  })

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure
    buildGetRequest(paths.toggle3ds.index, app)
      .expect(500, {'message': 'Unable to retrieve the 3D Secure setting.'})
      .end(done)
  })
})

describe('The turn on 3D Secure endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'toggle-3ds:update'
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should tell connector to turn on 3D Secure', function (done) {
    connectorMock.patch(CONNECTOR_TOGGLE_3DS_PATH, {'toggle_3ds': true})
      .reply(200, {})

    buildFormPostRequest(paths.toggle3ds.on, {}, true, app)
      .expect(303, {})
      .expect('Location', paths.toggle3ds.index + '?toggled')
      .end(done)
  })

  it('should display an error if connector returns failure', function (done) {
    connectorMock.patch(CONNECTOR_TOGGLE_3DS_PATH, {'toggle_3ds': true})
      .reply(999, {
        'message': 'Error message'
      })

    buildFormPostRequest(paths.toggle3ds.on, {}, true, app)
      .expect(500, {'message': 'Unable to toggle 3D Secure.'})
      .end(done)
  })

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure
    buildFormPostRequest(paths.toggle3ds.on, {}, true, app)
      .expect(500, {'message': 'Unable to toggle 3D Secure.'})
      .end(done)
  })

  it('should display an error if CSRF token does not exist', function (done) {
    buildFormPostRequest(paths.toggle3ds.on, {}, false, app)
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})

describe('The turn off 3D Secure endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'toggle-3ds:update'
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [{name: permissions}]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should tell connector to turn off 3D Secure', function (done) {
    connectorMock.patch(CONNECTOR_TOGGLE_3DS_PATH, {'toggle_3ds': false})
      .reply(200, {})

    buildFormPostRequest(paths.toggle3ds.off, {}, true, app)
      .expect(303, {})
      .expect('Location', paths.toggle3ds.index + '?toggled')
      .end(done)
  })

  it('should display an error if connector returns failure', function (done) {
    connectorMock.patch(CONNECTOR_TOGGLE_3DS_PATH, {'toggle_3ds': false})
      .reply(999, {
        'message': 'Error message'
      })

    buildFormPostRequest(paths.toggle3ds.off, {}, true, app)
      .expect(500, {'message': 'Unable to toggle 3D Secure.'})
      .end(done)
  })

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure
    buildFormPostRequest(paths.toggle3ds.off, {}, true, app)
      .expect(500, {'message': 'Unable to toggle 3D Secure.'})
      .end(done)
  })

  it('should display an error if CSRF token does not exist', function (done) {
    buildFormPostRequest(paths.toggle3ds.off, {}, false, app)
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})

describe('The confirm that you want to turn on 3D Secure endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'toggle-3ds:update'
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should display an error if CSRF token does not exist', function (done) {
    buildFormPostRequest(paths.toggle3ds.onConfirm, {}, false, app)
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})
