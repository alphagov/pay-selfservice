var dbMock = require(__dirname + '/../test_helpers/db_mock.js');
var request = require('supertest');
var _app = require(__dirname + '/../../server.js').getApp;
var winston = require('winston');
var nock = require('nock');
var csrf = require('csrf');
var should = require('chai').should();
var paths = require(__dirname + '/../../app/paths.js');
var session = require(__dirname + '/../test_helpers/mock_session.js');
var User = require(__dirname + '/../../app/models/user.js');
var Permission = require(__dirname + '/../../app/models/permission.js');
var Role = require(__dirname + '/../../app/models/role.js');
var UserRole = require(__dirname + '/../../app/models/user_role.js');

var ACCOUNT_ID = 182364;

var app = session.mockValidAccount(_app, ACCOUNT_ID);
var user = session.user;

var requestId = 'unique-request-id';
var aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
};

var CONNECTOR_ACCOUNT_PATH = "/v1/frontend/accounts/" + ACCOUNT_ID;
var CONNECTOR_ACCOUNT_SERVICE_NAME_PATH = CONNECTOR_ACCOUNT_PATH + "/servicename";
var connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader);

function sync_db() {
  return Permission.sequelize.sync({force: true})
    .then(() => Role.sequelize.sync({force: true}))
    .then(() => User.sequelize.sync({force: true}))
    .then(() => UserRole.sequelize.sync({force: true}))
}

function build_get_request(path) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id',requestId);
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
    .set('x-request-id',requestId)
    .send(sendData);
}

[
  {
    'path': paths.serviceName.index,
    'edit': false,
  },
  {
    'path': paths.serviceName.edit,
    'edit': true,
  }
].forEach(function (testSetup) {

    describe('The ' + testSetup.path + ' endpoint', function () {
      beforeEach(function () {
        nock.cleanAll();
      });

      before(function (done) {
        var roleDef;
        var permissionDef;
        var userAttributes = {
          username: user.username,
          password: 'password10',
          gateway_account_id: user.gateway_account_id,
          email: user.email,
          telephone_number: "1"
        };
        winston.level = 'none';
        sync_db()
          .then(()=> Permission.sequelize.create({name: 'service-name:read', description: 'Read service name'}))
          .then((permission)=> permissionDef = permission)
          .then(()=> Role.sequelize.create({name: 'Read', description: "User can read stuff"}))
          .then((role)=> roleDef = role)
          .then(()=> roleDef.setPermissions([permissionDef]))
          .then(()=> User.create(userAttributes, roleDef))
          .then(()=> done());
      });

      it('should display received service name from connector', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_PATH)
          .reply(200, {
            "service_name": "Service name"
          });

        var expectedData = {
          "serviceName": "Service name",
          "editMode": testSetup.edit
        };

        build_get_request(testSetup.path)
          .expect(200, expectedData)
          .end(done);
      });

      it('should display an error if the account does not exist', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_PATH)
          .reply(404, {
            "message": "The gateway account id '" + ACCOUNT_ID + "' does not exist"
          });

        build_get_request(testSetup.path)
          .expect(200, {"message": "Unable to retrieve the service name."})
          .end(done);
      });

      it('should display an error if connector returns any other error', function (done) {
        connectorMock.get(CONNECTOR_ACCOUNT_PATH)
          .reply(999, {
            "message": "Some error in Connector"
          });

        build_get_request(testSetup.path)
          .expect(200, {"message": "Unable to retrieve the service name."})
          .end(done);
      });

      it('should display an error if the connection to connector fails', function (done) {
        // No connectorMock defined on purpose to mock a network failure

        build_get_request(testSetup.path)
          .expect(200, {"message": "Internal server error"})
          .end(done);
      });
    });
  });

describe('The provider update service name endpoint', function () {

  beforeEach(function () {
    nock.cleanAll();
  });

  before(function (done) {
    var roleDef;
    var permissionDef;
    var userAttributes = {
      username: user.username,
      password: 'password10',
      gateway_account_id: user.gateway_account_id,
      email: user.email,
      telephone_number: "1"
    };
    winston.level = 'none';
    sync_db()
      .then(()=> Permission.sequelize.create({name: 'service-name:update', description: 'Update service name'}))
      .then((permission)=> permissionDef = permission)
      .then(()=> Role.sequelize.create({name: 'Update', description: "User can update stuff"}))
      .then((role)=> roleDef = role)
      .then(()=> roleDef.setPermissions([permissionDef]))
      .then(()=> User.create(userAttributes, roleDef))
      .then(()=> done());
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
  });
});
