const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const nock = require('nock')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))
const csrf = require('csrf')

const ACCOUNT_ID = 182364

let app

const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}

var CONNECTOR_ACCOUNT_PATH = '/v1/frontend/accounts/' + ACCOUNT_ID
var CONNECTOR_ACCOUNT_SERVICE_NAME_PATH = CONNECTOR_ACCOUNT_PATH + '/servicename'
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

[
  {
    'path': paths.serviceName.index,
    'edit': false
  },
  {
    'path': paths.serviceName.edit,
    'edit': true
  }
].forEach(function (testSetup) {
  describe('The ' + testSetup.path + ' endpoint', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'service-name:read'
      let user = session.getUser({
        gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should display received service name from connector', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
          .reply(200, {
            'service_name': 'Service name'
          })

      var expectedData = {
        'serviceName': 'Service name',
        'editMode': testSetup.edit,
        permissions: {
          'service_name_read': true
        },
        navigation: true,
        currentGatewayAccount: {
          'service_name': 'Service name'
        }
      }

      buildGetRequest(testSetup.path, app)
          .expect(200, expectedData)
          .end(done)
    })

    it('should display an error if the account does not exist', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
          .reply(404, {
            'message': "The gateway account id '" + ACCOUNT_ID + "' does not exist"
          })

      buildGetRequest(testSetup.path, app)
          .expect(500, {'message': 'Unable to retrieve the service name.'})
          .end(done)
    })

    it('should display an error if connector returns any other error', function (done) {
      connectorMock.get(CONNECTOR_ACCOUNT_PATH)
          .reply(999, {
            'message': 'Some error in Connector'
          })

      buildGetRequest(testSetup.path, app)
          .expect(500, {'message': 'Unable to retrieve the service name.'})
          .end(done)
    })

    it('should display an error if the connection to connector fails', function (done) {
        // No connectorMock defined on purpose to mock a network failure

      buildGetRequest(testSetup.path, app)
          .expect(500, {'message': 'Unable to retrieve the service name.'})
          .end(done)
    })
  })
})

describe('The provider update service name endpoint', function () {
  afterEach(function () {
    nock.cleanAll()
    app = null
  })

  beforeEach(function (done) {
    let permissions = 'service-name:update'
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    })
    app = session.getAppWithLoggedInUser(getApp(), user)

    userCreator.mockUserResponse(user.toJson(), done)
  })

  it('should send new service name to connector', function (done) {
    connectorMock.patch(CONNECTOR_ACCOUNT_SERVICE_NAME_PATH, {
      'service_name': 'Service name'
    })
      .reply(200, {})

    var sendData = {'service-name-input': 'Service name'}
    var expectedLocation = paths.serviceName.index
    var path = paths.serviceName.index
    buildFormPostRequest(path, sendData, true, app)
      .expect(303, {})
      .expect('Location', expectedLocation)
      .end(done)
  })

  it('should display an error if connector returns failure', function (done) {
    connectorMock.patch(CONNECTOR_ACCOUNT_PATH, {'service_name': 'Service name'})
      .reply(999, {
        'message': 'Error message'
      })

    var sendData = {'service-name-input': 'Service name'}
    var expectedData = {'message': 'Internal server error'}
    var path = paths.serviceName.index
    buildFormPostRequest(path, sendData, true, app)
      .expect(500, expectedData)
      .end(done)
  })

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure
    var sendData = {'service-name-input': 'Service name'}
    var expectedData = {'message': 'Internal server error'}
    var path = paths.serviceName.index
    buildFormPostRequest(path, sendData, true, app)
      .expect(500, expectedData)
      .end(done)
  })

  it('should display an error if csrf token does not exist for the update', function (done) {
    var sendData = {'service-name-input': 'Service name'}
    var path = paths.serviceName.index
    buildFormPostRequest(path, sendData, false, app)
      .expect(400, {message: 'There is a problem with the payments platform'})
      .end(done)
  })
})
