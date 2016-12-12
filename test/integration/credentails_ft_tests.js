var dbMock = require(__dirname + '/../test_helpers/db_mock.js');
var userPermissions = require(__dirname + '/../test_helpers/user_permissions.js');
var request = require('supertest');
var _app = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var nock = require('nock');
var csrf = require('csrf');
var should = require('chai').should();
var paths = require(__dirname + '/../../app/paths.js');
var session = require(__dirname + '/../test_helpers/mock_session.js');

var ACCOUNT_ID = 182364;
var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
var CONNECTOR_ACCOUNT_CREDENTIALS_PATH = CONNECTOR_ACCOUNT_PATH + "/credentials";
var CONNECTOR_ACCOUNT_NOTIFICATION_CREDENTIALS_PATH = "/v1/api/accounts/" + ACCOUNT_ID + "/notification-credentials";

var app = session.getAppWithLoggedInSession(_app, ACCOUNT_ID);
var requestId = 'some-unique-id';
var user = session.user;
var defaultCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
};

var connectorMock = nock(process.env.CONNECTOR_URL, defaultCorrelationHeader);

function build_get_request(path) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId);
}

function build_form_post_request(path, sendData, sendCSRF) {
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF;
  if (sendCSRF) {
    sendData.csrfToken = csrf().create('123');
  }

  return request(app)
    .post(path)
    .set('Accept', 'application/json')
    .set('Content-Type', 'application/x-www-form-urlencoded')
    .set('x-request-id', requestId)
    .send(sendData);
}

describe('The ' + paths.credentials.index + ' endpoint', function () {

  beforeEach(function () {
    nock.cleanAll();
  });

  before(function (done) {
    winston.level = 'none';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'gateway-credentials:read', done);
  });

  it('should display payment provider name in title case', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "credentials": {}
    };

    build_get_request(paths.credentials.index)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display empty credential values when no gateway credentials are set', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "credentials": {}
    };

    build_get_request(paths.credentials.index)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display received credentials from connector', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {"username": "a-username"}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editNotificationCredentialsMode": false,
      "editMode": false,
      "credentials": {
        'username': 'a-username'
      }
    };

    build_get_request(paths.credentials.index)
      .expect(200, expectedData)
      .end(done);
  });

  it('should return the account', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "credentials": {
        'username': 'a-username',
        'merchant_id': 'a-merchant-id'
      }
    };

    build_get_request(paths.credentials.index)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      });

    build_get_request(paths.credentials.index)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if connector returns any other error', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        "message": "Some error in Connector"
      });

    build_get_request(paths.credentials.index)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    build_get_request(paths.credentials.index)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The ' + paths.credentials.edit + ' endpoint', function () {

  beforeEach(function () {
    nock.cleanAll();
  });

  before(function (done) {
    winston.level = 'none';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'gateway-credentials:update', done);
  });

  it('should display payment provider name in title case', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": true,
      "editNotificationCredentialsMode": false,
      "credentials": {}
    };

    build_get_request(paths.credentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display empty credential values when no gateway credentials are set', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": true,
      "editNotificationCredentialsMode": false,
      "credentials": {}
    };

    build_get_request(paths.credentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display received credentials from connector', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {"username": "a-username"}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editNotificationCredentialsMode": false,
      "editMode": true,
      "credentials": {
        'username': 'a-username'
      }
    };

    build_get_request(paths.credentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should return the account', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": true,
      "editNotificationCredentialsMode": false,
      "credentials": {
        'username': 'a-username',
        'merchant_id': 'a-merchant-id'
      }
    };

    build_get_request(paths.credentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      });

    build_get_request(paths.credentials.edit)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if connector returns any other error', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        "message": "Some error in Connector"
      });

    build_get_request(paths.credentials.edit)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    build_get_request(paths.credentials.edit)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The ' + paths.notificationCredentials.edit + ' endpoint', function () {

  beforeEach(function () {
    nock.cleanAll();
  });

  before(function (done) {
    winston.level = 'none';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'gateway-credentials:update', done);
  });

  it('should display payment provider name in title case', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": false,
      "editNotificationCredentialsMode": true,
      "credentials": {}
    };

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display empty credential values when no gateway credentials are set', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": false,
      "editNotificationCredentialsMode": true,
      "credentials": {}
    };

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display received credentials from connector', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {"username": "a-username"}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editNotificationCredentialsMode": true,
      "editMode": false,
      "credentials": {
        'username': 'a-username'
      }
    };

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should return the account', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
      });

    var expectedData = {
      "payment_provider": "Sandbox",
      "editMode": false,
      "editNotificationCredentialsMode": true,
      "credentials": {
        'username': 'a-username',
        'merchant_id': 'a-merchant-id'
      }
    };

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      });

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if connector returns any other error', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        "message": "Some error in Connector"
      });

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    build_get_request(paths.notificationCredentials.edit)
      .expect(200, {"message": "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The notification credentials', function () {

  beforeEach(function () {
    nock.cleanAll();
  });

  before(function (done) {
    winston.level = 'none';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'gateway-credentials:read', done);
  });

  it('should pass through the notification credentials', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "smartpay",
        "gateway_account_id": "1",
        "credentials": {
          'username': "a-username",
          'merchant_id': 'a-merchant-id'
        },
        "notificationCredentials": {username: "a-notification-username"}
      });

    var expectedData = {
      "payment_provider": "Smartpay",
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "credentials": {
        'username': 'a-username',
        'merchant_id': 'a-merchant-id'
      },
      "notification_credentials": {username: "a-notification-username"}
    };

    build_get_request(paths.credentials.index)
      .expect(200, expectedData)
      .end(done);
  });
});

describe('The provider update credentials endpoint', function () {

  beforeEach(function () {
    nock.cleanAll();
  });

  before(function (done) {
    winston.level = 'none';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'gateway-credentials:update', done);
  });

  it('should send new username, password and merchant_id credentials to connector', function (done) {

    connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
      "credentials": {
        "username": "a-username",
        "password": "a-password",
        "merchant_id": "a-merchant-id"
      }
    }).reply(200, {});

//    verify_post_request(path, sendData, cookieValue, expectedRespCode, expectedData, expectedLocation) {
    var sendData = {'username': 'a-username', 'password': 'a-password', 'merchantId': 'a-merchant-id'};
    var expectedLocation = paths.credentials.index;
    var path = paths.credentials.index;
    build_form_post_request(path, sendData)
      .expect(303, {})
      .expect('Location', expectedLocation)
      .end(done);
  });

  it('should send any arbitrary credentials together with username and password to connector', function (done) {
    connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
      "credentials": {
        "username": "a-username",
        "password": "a-password"
      }
    })
      .reply(200, {});

    var sendData = {'username': 'a-username', 'password': 'a-password'};
    var expectedLocation = paths.credentials.index;
    var path = paths.credentials.index;
    build_form_post_request(path, sendData)
      .expect(303, {})
      .expect('Location', expectedLocation)
      .end(done);
  });

  it('should display an error if connector returns failure', function (done) {
    connectorMock.patch(CONNECTOR_ACCOUNT_PATH, {
      "username": "a-username",
      "password": "a-password"
    })
      .reply(999, {
        "message": "Error message"
      });

    var sendData = {'username': 'a-username', 'password': 'a-password'};
    var expectedData = {"message": "There is a problem with the payments platform"};
    var path = paths.credentials.index;
    build_form_post_request(path, sendData)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    var sendData = {'username': 'a-username', 'password': 'a-password'};
    var expectedData = {"message": "There is a problem with the payments platform"};
    var path = paths.credentials.index;
    build_form_post_request(path, sendData)
      .expect(200, expectedData)
      .end(done);
  });

  it('fail if there is no csrf', function (done) {
    connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
      "username": "a-username",
      "password": "a-password"
    })
      .reply(200, {});


//    verify_post_request(path, sendData, cookieValue, expectedRespCode, expectedData, expectedLocation) {
    var sendData = {'username': 'a-username', 'password': 'a-password'};
    var path = paths.credentials.index;
    build_form_post_request(path, sendData, false)
      .expect(200, {message: "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The provider update notification credentials endpoint', function () {

  beforeEach(function (done) {
    nock.cleanAll();
    done();
  });

  before(function (done) {
    winston.level = 'none';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'gateway-credentials:update', done);
  });

  it('should send new username and password notification credentials to connector', function (done) {
    connectorMock.post(CONNECTOR_ACCOUNT_NOTIFICATION_CREDENTIALS_PATH, {
      "username": "a-notification-username",
      "password": "a-notification-password"
    })
      .reply(200, {});


//    verify_post_request(path, sendData, cookieValue, expectedRespCode, expectedData, expectedLocation) {
    var sendData = {'username': 'a-notification-username', 'password': 'a-notification-password'};
    var expectedLocation = paths.credentials.index;
    var path = paths.notificationCredentials.update;
    build_form_post_request(path, sendData)
      .expect(303, {})
      .expect('Location', expectedLocation)
      .end(done);
  });
});

