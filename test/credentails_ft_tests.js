process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';

var request = require('supertest');
var app = require(__dirname + '/../server.js').getApp;
var winston = require('winston');
var portfinder = require('portfinder');
var nock = require('nock');
var cookie = require(__dirname + '/utils/session.js');
var should = require('chai').should();

portfinder.getPort(function (err, freePort) {

  var CONNECTOR_ACCOUNT_CREDENTIALS_PATH = "/v1/frontend/accounts/{accountId}";
  var ACCOUNT_ID = "12345";
  var SELF_SERVICE_CREDENTIALS_PATH = "/selfservice/credentials/{accountId}";
  var SELF_SERVICE_EDIT_CREDENTIALS_PATH = "/selfservice/credentials/{accountId}?edit";

  var localServer = 'http://localhost:' + freePort;

  var connectorMock = nock(localServer);

  [
    {'path':SELF_SERVICE_CREDENTIALS_PATH,
     'edit':false
    },
    {'path':SELF_SERVICE_EDIT_CREDENTIALS_PATH,
    'edit':true
    }
   ].forEach(function(testSetup) {

    describe('The ' + testSetup.path + ' endpoint', function () {

      beforeEach(function () {
        process.env.CONNECTOR_URL = localServer;
        nock.cleanAll();
      });

      before(function () {
        // Disable logging.
        winston.level = 'none';
      });


      it('should display payment provider name in title case', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
           "account_id": "1",
           "credentials": {}
        };
        if(testSetup.edit) expectedData.editMode = 'true';

        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, expectedData)
          .end(done);
      });

      it('should display empty credential values when no gateway credentials are set', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
           "account_id": "1",
           "credentials": {}
        };
        if(testSetup.edit) expectedData.editMode = 'true';

        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, expectedData)
          .end(done);
      });

      it('should display received credentials from connector', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {"username": "a-username"}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
           "account_id": "1",
           "credentials": {
             'username': 'a-username'
           }
        };
        if(testSetup.edit) expectedData.editMode = 'true';

        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, expectedData)
          .end(done);
      });

      it('should return the account id', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
          .reply(200, {
            "payment_provider": "sandbox",
            "gateway_account_id": "1",
            "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
          });

        var expectedData = {
           "payment_provider": "Sandbox",
            "account_id": "1",
            "credentials": {
              'username': 'a-username',
              'merchant_id': 'a-merchant-id'
            }
        };
        if(testSetup.edit) expectedData.editMode = 'true';

        if(testSetup.edit) expectedData.editMode = 'true';
        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, expectedData)
          .end(done);
      });

      it('should display an error if the account does not exist', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
          .reply(404, {
            "message": "The gateway account id '"+ACCOUNT_ID+"' does not exist"
          });

        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, {
            "message": "There is a problem with the payments platform",
          })
          .end(done);
      });

      it('should display an error if connector returns any other error', function (done) {

        connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
          .reply(999, {
            "message": "Some error in Connector"
          });

        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, {
            "message": "There is a problem with the payments platform",
          })
          .end(done);
      });

      it('should display an error if the connection to connector fails', function (done){

        // No connectorMock defined on purpose to mock a network failure

        request(app)
          .get(testSetup.path.replace("{accountId}", ACCOUNT_ID))
          .set('Accept', 'application/json')
          .expect(200, {
            "message": "There is a problem with the payments platform",
          })
          .end(done);

      });

    });

  });

  describe('The provider update credentials endpoint', function () {

    beforeEach(function () {
      process.env.CONNECTOR_URL = localServer;
      nock.cleanAll();
    });

    before(function () {
      // Disable logging.
      winston.level = 'none';
    });

    it('should send new username and password credentials to connector', function (done) {

      connectorMock.put(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID), {
        "username": "a-username",
        "password": "a-password"
      })
      .reply(200, {});

      request(app)
        .post(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            'username': 'a-username',
            'password': 'a-password'
         })
        .expect(303, {})
        .expect('Location', SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .end(done);
    });

    it('should send any arbitrary credentials together with username and password to connector', function (done) {

      connectorMock.put(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID), {
        "username": "a-username",
        "password": "a-password",
        "merchant_id": "a-merchant-id"
      })
      .reply(200, {});

      request(app)
        .post(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            'username': 'a-username',
            'password': 'a-password',
            'merchantId': 'a-merchant-id',
         })
        .expect(303, {})
        .expect('Location', SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .end(done);
    });

    it('should display an error if connector returns failure', function (done) {

      connectorMock.put(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID), {
        "username": "a-username",
        "password": "a-password"
      })
      .reply(999, {
        "message": "Error message"
      });

      request(app)
        .post(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
            'username': 'a-username',
            'password': 'a-password'
         })
        .expect(200, {
            "message": "There is a problem with the payments platform",
        })
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done){

      // No connectorMock defined on purpose to mock a network failure

      request(app)
        .post(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          'username': 'a-username',
          'password': 'a-password'
        })
        .expect(200, {
          "message": "There is a problem with the payments platform",
        })
        .end(done);

    });

  });

});