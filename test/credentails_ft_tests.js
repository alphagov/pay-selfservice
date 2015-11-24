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

  var localServer = 'http://localhost:' + freePort;

  var connectorMock = nock(localServer);
  describe('The provider credentials endpoint', function () {

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

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "payment_provider": "Sandbox",
          "account_id": "1",
          "credentials": {}
        })
        .end(done);
    });

    it('should display empty credential values when no gateway credentials are set', function (done) {

      connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .reply(200, {
          "payment_provider": "sandbox",
          "gateway_account_id": "1",
          "credentials": {}
        });

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "payment_provider": "Sandbox",
          "account_id": "1",
          "credentials": {}
        })
        .end(done);
    });

    it('should display username and obfuscated password when gateway credentials are set', function (done) {

      connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .reply(200, {
          "payment_provider": "sandbox",
          "gateway_account_id": "1",
          "credentials": {"username": "a-username"}
        });

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "payment_provider": "Sandbox",
          "account_id": "1",
          "credentials": {
            'username': 'a-username',
            'password': '****'
          }
        })
        .end(done);
    });

    it('should display merchant id along with username/password if merchant id is set', function (done) {

      connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .reply(200, {
          "payment_provider": "sandbox",
          "gateway_account_id": "1",
          "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
        });

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "payment_provider": "Sandbox",
          "account_id": "1",
          "credentials": {
            'username': 'a-username',
            'password': '****',
            'merchant_id': 'a-merchant-id'
          }
        })
        .end(done);
    });

    it('should return the account id', function (done) {

      connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .reply(200, {
          "payment_provider": "sandbox",
          "gateway_account_id": "1",
          "credentials": {username: "a-username", merchant_id: 'a-merchant-id'}
        });

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "payment_provider": "Sandbox",
          "account_id": "1",
          "credentials": {
            'username': 'a-username',
            'password': '****',
            'merchant_id': 'a-merchant-id'
          }
        })
        .end(done);
    });

    it('should display an error if the account does not exist', function (done) {

      connectorMock.get(CONNECTOR_ACCOUNT_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .reply(404, {
          "message": "The gateway account id '"+ACCOUNT_ID+"' does not exist"
        });

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
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
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "message": "There is a problem with the payments platform",
        })
        .end(done);
    });

    it('should display an error if the connection to connector fails', function (done){

      // No connectorMock defined on purpose to mock a network failure

      request(app)
        .get(SELF_SERVICE_CREDENTIALS_PATH.replace("{accountId}", ACCOUNT_ID))
        .set('Accept', 'application/json')
        .expect(200, {
          "message": "There is a problem with the payments platform",
        })
        .end(done);

    });

  });
});