require(__dirname + '/../test_helpers/serialize_mock.js');
var userCreator = require(__dirname + '/../test_helpers/user_creator.js');
var request = require('supertest');
var getApp = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var nock = require('nock');
var csrf = require('csrf');
var should = require('chai').should();
var paths = require(__dirname + '/../../app/paths.js');
var app;
var session = require(__dirname + '/../test_helpers/mock_session.js');

var ACCOUNT_ID = 182364;
var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
var CONNECTOR_ACCOUNT_CREDENTIALS_PATH = CONNECTOR_ACCOUNT_PATH + "/credentials";
var CONNECTOR_ACCOUNT_NOTIFICATION_CREDENTIALS_PATH = "/v1/api/accounts/" + ACCOUNT_ID + "/notification-credentials";

var requestId = 'some-unique-id';
var defaultCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
};

var connectorMock = nock(process.env.CONNECTOR_URL, defaultCorrelationHeader);

function build_get_request(path, app) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId);
}

function build_form_post_request(path, sendData, sendCSRF, app) {
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

  afterEach(function () {
    nock.cleanAll();
    app = null;
  });

  beforeEach(function (done) {
    let permissions = 'gateway-credentials:read';
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    });
    app = session.getAppWithLoggedInUser(getApp(), user);

    userCreator.mockUserResponse(user.toJson(), done);
  });

  it('should display payment provider name in title case', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {}
      },
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "permissions": {
        gateway_credentials_read: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.index, app)
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
      currentGatewayAccount: {
        "payment_provider": "sandbox",
        "credentials": {},
        "gateway_account_id": "1",
      },
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "permissions": {
        gateway_credentials_read: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.index, app)
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
      currentGatewayAccount: {
        "payment_provider": "sandbox",
        "credentials": {
          'username': 'a-username'
        },
        "gateway_account_id": "1",
      },
      "editNotificationCredentialsMode": false,
      "editMode": false,
      "permissions": {
        gateway_credentials_read: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.index, app)
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
      currentGatewayAccount: {
        "payment_provider": "sandbox",
        "credentials": {
          'username': 'a-username',
          merchant_id: 'a-merchant-id'
        },
        "gateway_account_id": "1",
      },
      "editMode": false,
      "editNotificationCredentialsMode": false,
      "permissions": {
        gateway_credentials_read: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.index, app)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      });

    build_get_request(paths.credentials.index, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if connector returns any other error', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        "message": "Some error in Connector"
      });

    build_get_request(paths.credentials.index, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    build_get_request(paths.credentials.index, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The ' + paths.credentials.edit + ' endpoint', function () {

  afterEach(function () {
    nock.cleanAll();
    app = null;
  });

  beforeEach(function (done) {
    let permissions = 'gateway-credentials:update';
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    });
    app = session.getAppWithLoggedInUser(getApp(), user);

    userCreator.mockUserResponse(user.toJson(), done);
  });

  it('should display payment provider name in title case', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {}
      },
      "editMode": true,
      "editNotificationCredentialsMode": false,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.edit, app)
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
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {}
      },
      "editMode": true,
      "editNotificationCredentialsMode": false,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.edit, app)
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
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {"username": "a-username"}
      },
      "editNotificationCredentialsMode": false,
      "editMode": true,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.edit, app)
      .expect(200, expectedData)
      .end(done);
  });

  it('should return the account', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {username: "a-username"},
      });

    var expectedData = {
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {"username": "a-username"}
      },
      "editMode": true,
      "editNotificationCredentialsMode": false,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.edit, app)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      });

    build_get_request(paths.credentials.edit, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if connector returns any other error', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        "message": "Some error in Connector"
      });

    build_get_request(paths.credentials.edit, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    build_get_request(paths.credentials.edit, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The ' + paths.notificationCredentials.edit + ' endpoint', function () {

  afterEach(function () {
    nock.cleanAll();
    app = null;
  });

  beforeEach(function (done) {
    let permissions = 'gateway-credentials:update';
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    });
    app = session.getAppWithLoggedInUser(getApp(), user);

    userCreator.mockUserResponse(user.toJson(), done);
  });

  it('should display payment provider name in title case', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {}
      });

    var expectedData = {
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {},
      },
      "editMode": false,
      "editNotificationCredentialsMode": true,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.notificationCredentials.edit, app)
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
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {},
      },
      "editMode": false,
      "editNotificationCredentialsMode": true,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.notificationCredentials.edit, app)
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
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {
          'username': 'a-username'
        },
      },
      "editNotificationCredentialsMode": true,
      "editMode": false,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.notificationCredentials.edit, app)
      .expect(200, expectedData)
      .end(done);
  });

  it('should return the account', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(200, {
        "payment_provider": "sandbox",
        "gateway_account_id": "1",
        "credentials": {username: "a-username", merchant_id: 'a-merchant-id'},
      });

    var expectedData = {
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "sandbox",
        "credentials": {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        },
      },
      "editMode": false,
      "editNotificationCredentialsMode": true,
      "permissions": {
        gateway_credentials_update: true
      },
      navigation: true
    };

    build_get_request(paths.notificationCredentials.edit, app)
      .expect(200, expectedData)
      .end(done);
  });

  it('should display an error if the account does not exist', function (done) {
    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(404, {
        "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
      });

    build_get_request(paths.notificationCredentials.edit, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if connector returns any other error', function (done) {

    connectorMock.get(CONNECTOR_ACCOUNT_PATH)
      .reply(999, {
        "message": "Some error in Connector"
      });

    build_get_request(paths.notificationCredentials.edit, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    build_get_request(paths.notificationCredentials.edit, app)
      .expect(500, {"message": "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The notification credentials', function () {
  afterEach(function () {
    nock.cleanAll();
    app = null;
  });

  beforeEach(function (done) {
    let permissions = 'gateway-credentials:read';
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    });
    app = session.getAppWithLoggedInUser(getApp(), user);

    userCreator.mockUserResponse(user.toJson(), done);
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
        "notification_credentials": {username: "a-notification-username"}
      });

    var expectedData = {
      currentGatewayAccount: {
        "gateway_account_id": "1",
        "payment_provider": "smartpay",
        "credentials": {
          'username': 'a-username',
          'merchant_id': 'a-merchant-id'
        },
        "notification_credentials": {username: "a-notification-username"}
      },
      "editNotificationCredentialsMode": false,

      "editMode": false,

      "permissions": {
        gateway_credentials_read: true
      },
      navigation: true
    };

    build_get_request(paths.credentials.index, app)
      .expect(200, expectedData)
      .end(done);
  });
});

describe('The provider update credentials endpoint', function () {

  afterEach(function () {
    nock.cleanAll();
    app = null;
  });

  beforeEach(function (done) {
    let permissions = 'gateway-credentials:update';
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    });
    app = session.getAppWithLoggedInUser(getApp(), user);

    userCreator.mockUserResponse(user.toJson(), done);
  });

  it('should send new username, password and merchant_id credentials to connector', function (done) {

    connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
      "credentials": {
        "username": "a-username",
        "password": "a-password",
        "merchant_id": "a-merchant-id"
      }
    }).reply(200, {});

    var sendData = {'username': 'a-username', 'password': 'a-password', 'merchantId': 'a-merchant-id'};
    var expectedLocation = paths.credentials.index;
    var path = paths.credentials.index;
    build_form_post_request(path, sendData, true, app)
      .expect(303, {})
      .expect('Location', expectedLocation)
      .end(done);
  });

  it('should send new username, password, merchant_id, sha_in_passphrase and sha_out_passphrase credentials to connector', function (done) {

    connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
      "credentials": {
        "username": "a-username",
        "password": "a-password",
        "merchant_id": "a-psp-id",
        "sha_in_passphrase": "a-sha-in-passphrase",
        "sha_out_passphrase": "a-sha-out-passphrase"

      }
    }).reply(200, {});

    var sendData = {'username': 'a-username', 'password': 'a-password',  'merchantId': 'a-psp-id',
                    'shaInPassphrase': 'a-sha-in-passphrase', 'shaOutPassphrase': 'a-sha-out-passphrase'};
    var expectedLocation = paths.credentials.index;
    var path = paths.credentials.index;
    build_form_post_request(path, sendData, true, app)
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
    build_form_post_request(path, sendData, true, app)
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
    build_form_post_request(path, sendData, true, app)
      .expect(500, expectedData)
      .end(done);
  });

  it('should display an error if the connection to connector fails', function (done) {
    // No connectorMock defined on purpose to mock a network failure

    var sendData = {'username': 'a-username', 'password': 'a-password'};
    var expectedData = {"message": "There is a problem with the payments platform"};
    var path = paths.credentials.index;
    build_form_post_request(path, sendData, true, app)
      .expect(500, expectedData)
      .end(done);
  });

  it('should fail if there is no csrf', done => {
    connectorMock.patch(CONNECTOR_ACCOUNT_CREDENTIALS_PATH, {
      "username": "a-username",
      "password": "a-password"
    }).reply(200, {});

    const sendData = {'username': 'a-username', 'password': 'a-password'};
    const path = paths.credentials.index;
    build_form_post_request(path, sendData, false, app)
      .expect(400, {message: "There is a problem with the payments platform"})
      .end(done);
  });
});

describe('The provider update notification credentials endpoint', function () {

  afterEach(function () {
    nock.cleanAll();
    app = null;
  });

  beforeEach(function (done) {
    let permissions = 'gateway-credentials:update';
    var user = session.getUser({
      gateway_account_ids: [ACCOUNT_ID], permissions: [permissions]
    });
    app = session.getAppWithLoggedInUser(getApp(), user);

    userCreator.mockUserResponse(user.toJson(), done);
  });

  it('should send new username and password notification credentials to connector', function (done) {
    connectorMock.post(CONNECTOR_ACCOUNT_NOTIFICATION_CREDENTIALS_PATH, {
      "username": "a-notification-username",
      "password": "a-notification-password"
    })
      .reply(200, {});

    var sendData = {'username': 'a-notification-username', 'password': 'a-notification-password'};
    var expectedLocation = paths.credentials.index;
    var path = paths.notificationCredentials.update;
    build_form_post_request(path, sendData, true, app)
      .expect(303, {})
      .expect('Location', expectedLocation)
      .end(done);
  });
});

