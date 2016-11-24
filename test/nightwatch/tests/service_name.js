var dbMock = require(__dirname + '/../../test_helpers/db_mock.js');
var userPermissions = require(__dirname + '/../../test_helpers/user_permissions.js');
var _app = require(__dirname + '/../../../server.js').getApp;
var winston = require('winston');
var mockConnector = require('/../mock/connector.js');
var nock = require('nock');
var should = require('chai').should();
var paths = require(__dirname + '/../../../app/paths.js');
var session = require(__dirname + '/../../test_helpers/mock_session.js');
var ACCOUNT_ID = 182364;

var connectorMock = nock(process.env.CONNECTOR_URL);
var app = session.mockValidAccount(_app, ACCOUNT_ID);
var user = session.user;

var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;

describe('The ' + paths.serviceName.index + ' endpoint', function () {

  var server;
  var handler = function () {
    server.close();
  };

  beforeEach(function (browser, done) {
    nock.cleanAll();
    done();
  });

  before(function (browser, done) {
    winston.level = 'all';
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    userPermissions.create(userAttributes, 'service-name:read')
      .then(() => server = app.listen(7999))
      .then(() => connectorMock.get(CONNECTOR_ACCOUNT_PATH)
        .reply(200, {
          "service_name": "Service name"
        }))
      .then(done());
  });

  after(function (browser, done) {
    browser
      .end(() => {
        handler();
        console.log('Done!');
        done();
      });
  });

  it('should display received service name from connector', function (browser) {

    mockConnector
      .getGatewayAccount(ACCOUNT_ID)
      .reply(200, {
        "service_name": "Money for slackers"
      }).then(() => {

      browser
        .url("http://localhost:7999" + paths.serviceName.index)
        .waitForElementVisible('#service-name');

      browser.

    });
    var expectedData = {
      "serviceName": "Service name",
      "editMode": false
    };

    browser
      .url("http://localhost:7999" + paths.serviceName.index);

    browser.pause("1000000");
    browser.source(function (result) {
      console.log(result.value);
    });

    //build_get_request(paths.serviceName.index)
    //  .expect(200, expectedData)
    //  .end(done);
  });

  /*it('should display an error if the account does not exist', function (done) {
   connectorMock.get(CONNECTOR_ACCOUNT_PATH)
   .reply(404, {
   "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
   });

   build_get_request(paths.serviceName.index)
   .expect(200, {"message": "Unable to retrieve the service name."})
   .end(done);
   });

   it('should display an error if connector returns any other error', function (done) {
   connectorMock.get(CONNECTOR_ACCOUNT_PATH)
   .reply(999, {
   "message": "Some error in Connector"
   });

   build_get_request(paths.serviceName.index)
   .expect(200, {"message": "Unable to retrieve the service name."})
   .end(done);
   });

   it('should display an error if the connection to connector fails', function (done) {
   // No connectorMock defined on purpose to mock a network failure

   build_get_request(paths.serviceName.index)
   .expect(200, {"message": "Internal server error"})
   .end(done);
   });
   });

   describe('The ' + paths.serviceName.edit + ' endpoint', function () {
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
   userPermissions.create(userAttributes, 'service-name:read', done);
   });

   it('should display received service name from connector', function (done) {
   connectorMock.get(CONNECTOR_ACCOUNT_PATH)
   .reply(200, {
   "service_name": "Service name"
   });

   var expectedData = {
   "serviceName": "Service name",
   "editMode": true
   };

   build_get_request(paths.serviceName.edit)
   .expect(200, expectedData)
   .end(done);
   });

   it('should display an error if the account does not exist', function (done) {
   connectorMock.get(CONNECTOR_ACCOUNT_PATH)
   .reply(404, {
   "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
   });

   build_get_request(paths.serviceName.edit)
   .expect(200, {"message": "Unable to retrieve the service name."})
   .end(done);
   });

   it('should display an error if connector returns any other error', function (done) {
   connectorMock.get(CONNECTOR_ACCOUNT_PATH)
   .reply(999, {
   "message": "Some error in Connector"
   });

   build_get_request(paths.serviceName.edit)
   .expect(200, {"message": "Unable to retrieve the service name."})
   .end(done);
   });

   it('should display an error if the connection to connector fails', function (done) {
   // No connectorMock defined on purpose to mock a network failure

   build_get_request(paths.serviceName.edit)
   .expect(200, {"message": "Internal server error"})
   .end(done);
   });
   });

   describe('The provider update service name endpoint', function () {

   beforeEach(function () {
   nock.cleanAll();
   });

   before(function (done) {
   var userAttributes = {
   username: user.username,
   password: 'password10',
   gateway_account_id: user.gateway_account_id,
   email: user.email,
   telephone_number: "1"
   };
   userPermissions.create(userAttributes, 'service-name:update', done);
   });

   it('should send new service name to connector', function (done) {
   connectorMock.patch(CONNECTOR_ACCOUNT_SERVICE_NAME_PATH, {
   "service_name": "Service name"
   })
   .reply(200, {});

   var sendData = {'service-name-input': 'Service name'};
   var expectedLocation = paths.serviceName.index;
   var path = paths.serviceName.index;
   build_form_post_request(path, sendData)
   .expect(303, {})
   .expect('Location', expectedLocation)
   .end(done);
   });

   it('should display an error if connector returns failure', function (done) {
   connectorMock.patch(CONNECTOR_ACCOUNT_PATH, {"service_name": "Service name"})
   .reply(999, {
   "message": "Error message"
   });

   var sendData = {'service-name-input': 'Service name'};
   var expectedData = {"message": "Internal server error"};
   var path = paths.serviceName.index;
   build_form_post_request(path, sendData)
   .expect(200, expectedData)
   .end(done);
   });

   it('should display an error if the connection to connector fails', function (done) {
   // No connectorMock defined on purpose to mock a network failure
   var sendData = {'service-name-input': 'Service name'};
   var expectedData = {"message": "Internal server error"};
   var path = paths.serviceName.index;
   build_form_post_request(path, sendData)
   .expect(200, expectedData)
   .end(done);
   });

   it('should display an error if csrf token does not exist for the update', function (done) {
   var sendData = {'service-name-input': 'Service name'};
   var path = paths.serviceName.index;
   build_form_post_request(path, sendData, false)
   .expect(200, {message: "There is a problem with the payments platform"})
   .end(done);
   });*/
});
