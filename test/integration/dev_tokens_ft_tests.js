var dbMock       = require(__dirname + '/../test_helpers/db_mock.js');
var userCreator = require(__dirname + '/../test_helpers/user_creator.js');
var request      = require('supertest');
var _app         = require(__dirname + '/../../server.js').getApp;
var winston      = require('winston');
var portfinder   = require('portfinder');
var nock         = require('nock');
var csrf         = require('csrf');
var should       = require('chai').should();
var paths        = require(__dirname + '/../../app/paths.js');
var session      = require(__dirname + '/../test_helpers/mock_session.js');

var ACCOUNT_ID = 98344;
var TOKEN = '00112233';
var PUBLIC_AUTH_PATH = '/v1/frontend/auth';
var CONNECTOR_PATH = '/v1/frontend/accounts/{accountId}';

var app     = session.getAppWithLoggedInSession(_app, ACCOUNT_ID);
var user = session.user;

portfinder.getPort(function(err, freePort) {

  var requestId = 'unique-request-id';
  var aCorrelationHeader = {
    reqheaders: {'x-request-id': requestId}
  };

  var localServer = 'http://localhost:' + freePort;
  var serverMock = nock(localServer, aCorrelationHeader);

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

  function build_put_request(sendCSRF) {
    var data = {};
    sendCSRF = (sendCSRF === undefined) ? true : sendCSRF;
    if (sendCSRF) {
      data.csrfToken = csrf().create('123');
    }
    data.token_link = '550e8400-e29b-41d4-a716-446655440000';
    data.description = "token description";
     return request(app)
        .put(paths.devTokens.index)
        .set('Accept', 'application/json')
        .set('x-request-id',requestId)
        .send(data);
  }

  describe.only('Dev Tokens Endpoints', function() {

      beforeEach(function() {
        process.env.PUBLIC_AUTH_URL = localServer + PUBLIC_AUTH_PATH;
        process.env.CONNECTOR_URL = localServer;
        nock.cleanAll();
      });

      before(function () {
        // Disable logging.
        winston.level = 'none';
      });

      describe('The /tokens/revoked endpoint (read revoked tokens)', function() {

        before(function (done) {
          winston.level = 'none';
          var userAttributes = {
            username: user.username,
            password: 'password10',
            gateway_account_id: user.gateway_account_id,
            email: user.email,
            telephone_number: "1"
          };
          userCreator.createUserWithPermission(userAttributes, 'tokens-revoked:read', done);
        });

        it('should return an empty list of tokens if no tokens have been revoked yet', function (done) {
          serverMock.get(CONNECTOR_PATH.replace("{accountId}", ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID + "?state=revoked")
            .reply(200, {
              "account_id": ACCOUNT_ID
            });

          build_get_request(paths.devTokens.revoked)
            .expect(200, {
              "active": false,
              "header": 'revoked-tokens',
              "token_state": 'revoked',
              "tokens": [],
              "tokens_singular": false
            })
            .end(done);
        });

        it('should return the account_id and the token list for the only revoked token', function (done) {

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID + "?state=revoked")
            .reply(200, {
              "account_id": ACCOUNT_ID,
              "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1", 'revoked': "18 Oct 2015"}]
            });

          build_get_request(paths.devTokens.revoked)
            .expect(function(res){
              if (!res.body.tokens[0].csrfToken)  throw new Error('no token');
              delete res.body.tokens[0].csrfToken;
            })
            .expect(200, {
              "active": false,
              "header": 'revoked-tokens',
              "token_state": 'revoked',
              "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1", 'revoked': "18 Oct 2015"}],
              "tokens_singular": true,
            })
            .end(done);
        });

        it('should return the account_id and the token list for multiple revoked tokens', function (done){
          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID + "?state=revoked")
            .reply(200, {
              "account_id": ACCOUNT_ID,
              "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1", 'revoked': "18 Oct 2015"},
                         {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2", 'revoked': "19 Oct 2015"}]
            });

          build_get_request(paths.devTokens.revoked)
            .expect(function(res){
              if (!res.body.tokens[0].csrfToken)  throw new Error('no token');
              delete res.body.tokens[0].csrfToken;
              if (!res.body.tokens[1].csrfToken)  throw new Error('no token');
              delete res.body.tokens[1].csrfToken;
            })
            .expect(200, {
              "active": false,
              "header": 'revoked-tokens',
              "token_state": 'revoked',
              "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1", 'revoked': "18 Oct 2015"},
                {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2", 'revoked': "19 Oct 2015"}],
              "tokens_singular": false,
            })
            .end(done);
        });
      });

      describe('The GET /tokens endpoint (read active tokens)', function() {

        before(function (done) {
          winston.level = 'none';
          var userAttributes = {
            username: user.username,
            password: 'password10',
            gateway_account_id: user.gateway_account_id,
            email: user.email,
            telephone_number: "1"
          };
          userCreator.createUserWithPermission(userAttributes, 'tokens-active:read', done);
        });

        it('should return an empty list of tokens if no tokens have been issued yet', function (done){
          serverMock.get(CONNECTOR_PATH.replace("{accountId}", ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID)
            .reply(200, {
                "account_id": ACCOUNT_ID
            });

          build_get_request(paths.devTokens.index)
            .expect(200, {
              "active": true,
              "header": 'available-tokens',
              "token_state": 'active',
              "tokens": [],
              "tokens_singular": false
            })
            .end(done);
        });

        it('should return the account_id and the token list for the only already-issued token', function (done){

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID)
            .reply(200, {
                "account_id": ACCOUNT_ID,
                "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1"}]
            });

          build_get_request(paths.devTokens.index)
          .expect(function(res){
              if (!res.body.tokens[0].csrfToken)  throw new Error('no token');
              delete res.body.tokens[0].csrfToken;
            })
            .expect(200, {
              "active": true,
              "header": 'available-tokens',
              "token_state": 'active',
              "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1"}],
              "tokens_singular": true,
            })
            .end(done);
        });

        it('should return the account_id and the token list for already-issued tokens', function (done){
          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID)
            .reply(200, {
                "account_id": ACCOUNT_ID,
                "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"},
                           {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2"}]
            });

          build_get_request(paths.devTokens.index)
            .expect(function(res){
              if (!res.body.tokens[0].csrfToken)  throw new Error('no token');
              delete res.body.tokens[0].csrfToken;
              if (!res.body.tokens[1].csrfToken)  throw new Error('no token');
              delete res.body.tokens[1].csrfToken;
            })
            .expect(200, {
              "active": true,
              "header": 'available-tokens',
              "token_state": 'active',
              "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"},
                         {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2"}],
              "tokens_singular": false,
            })
            .end(done);
        });
      });

    describe('The PUT /tokens endpoint (update token - description)', function() {

      before(function (done) {
        winston.level = 'none';
        var userAttributes = {
          username: user.username,
          password: 'password10',
          gateway_account_id: user.gateway_account_id,
          email: user.email,
          telephone_number: "1"
        };
        userCreator.createUserWithPermission(userAttributes, 'tokens:update', done);
      });

      it('should update the description', function (done){
        serverMock.put(PUBLIC_AUTH_PATH, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000',
          "description": "token description"
        }).reply(200, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000',
          "description": "token description",
          "created_by": "test-user",
          "issued_date": "18 Feb 2016 - 12:44",
          "last_used": "23 Feb 2016 - 19:44"
        });

        build_put_request()
          .expect(function(res){
            if (!res.body.csrfToken)  throw new Error('no token');
            delete res.body.csrfToken;
          })
          .expect(200, {
            'token_link': '550e8400-e29b-41d4-a716-446655440000',
            'description': "token description",
            'created_by': "test-user",
            'issued_date': "18 Feb 2016 - 12:44",
            'last_used': "23 Feb 2016 - 19:44"
          })
          .end(done);
      });

      it('should not update the description without csrf', function (done){
        serverMock.put(PUBLIC_AUTH_PATH, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000',
          "description": "token description"
        }).reply(200, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000',
          "description": "token description"
        });

        build_put_request(false)
          .expect(200, {
            'message': 'There is a problem with the payments platform'
          })
          .end(done);
      });

      it('should forward the error status code when updating the description', function (done){
        serverMock.put(PUBLIC_AUTH_PATH, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000',
          "description": "token description"
        }).reply(400, {});

        build_put_request()
          .expect(400, {})
          .end(done);

      });

      it('should send 500 if any error happens while updating the resource', function (done){
        // No serverMock defined on purpose to mock a network failure
        build_put_request()
          .expect(500, {})
          .end(done);
      });
    });

    describe('The DELETE /tokens endpoint (delete tokens)', function() {


      before(function (done) {
        winston.level = 'none';
        var userAttributes = {
          username: user.username,
          password: 'password10',
          gateway_account_id: user.gateway_account_id,
          email: user.email,
          telephone_number: "1"
        };
        userCreator.createUserWithPermission(userAttributes, 'tokens:delete', done);
      });

      it('should revoke and existing token', function (done){

        serverMock.delete(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000'
        }).reply(200, {"revoked": "15 Oct 2015"});

        request(app)
          .delete(paths.devTokens.index + "?token_link=550e8400-e29b-41d4-a716-446655440000")
          .set('x-request-id',requestId)
          .send({ csrfToken: csrf().create('123') })
          .expect(200, {"revoked": "15 Oct 2015"})
          .end(done);

      });

      it('should fail if no csrf', function (done){

        serverMock.delete(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000'
        }).reply(200, {"revoked": "15 Oct 2015"});

        request(app)
          .delete(paths.devTokens.index + "?token_link=550e8400-e29b-41d4-a716-446655440000")
          .set('x-request-id',requestId)
          .set('Accept', 'application/json')
          .expect(200, {message: "There is a problem with the payments platform"})
          .end(done);
      });

      it('should forward the error status code when revoking the token', function (done){
        serverMock.delete(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID, {
          "token_link": '550e8400-e29b-41d4-a716-446655440000'
        }).reply(400, {});

        request(app)
          .delete(paths.devTokens.index + "?token_link=550e8400-e29b-41d4-a716-446655440000")
          .set('x-request-id',requestId)
          .send({ csrfToken: csrf().create('123') })
          .expect(400, {})
          .end(done);
      });


      it('should send 500 if any error happens while updating the resource', function (done){

        // No serverMock defined on purpose to mock a network failure
        request(app)
          .delete(paths.devTokens.index)
          .set('x-request-id',requestId)
          .send({
            token_link: '550e8400-e29b-41d4-a716-446655440000',
            csrfToken: csrf().create('123')

          })
          .expect(500, {})
          .end(done);
      });
    });

      describe('The /tokens/generate endpoint (create tokens and show generated token)', function() {

        before(function (done) {
          winston.level = 'none';
          var userAttributes = {
            username: user.username,
            password: 'password10',
            gateway_account_id: user.gateway_account_id,
            email: user.email,
            telephone_number: "1"
          };
          userCreator.createUserWithPermission(userAttributes, 'tokens:create', done);
        });

        it('should create a token successfully', function (done){

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.post(PUBLIC_AUTH_PATH, {
            "account_id": ACCOUNT_ID,
            "description": "description",
            "created_by": user.email
          }).reply(200, {"token": TOKEN });

          build_form_post_request(paths.devTokens.create, {"description":'description'}, true)
            .expect(200, {
              'token': TOKEN,
              'description': 'description'
            })
            .end(done);

        });

         it('should fail if the account does not exist for a GET', function (done){
            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(400);

            build_get_request(paths.devTokens.show)
              .expect(200, {
                 'message' : 'There is a problem with the payments platform'
              })
              .end(done);

          });

          it('should only return the account_id', function (done){
            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            build_get_request(paths.devTokens.show)
              .expect(200, {
                'account_id': ACCOUNT_ID
              })
              .end(done);
          });

          it('should fail if the account does not exist for a POST', function (done){
            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(400);

            serverMock.post(PUBLIC_AUTH_PATH, {
              "account_id": ACCOUNT_ID,
              "description": "description"
            }).reply(200, {"token": TOKEN });

            build_form_post_request(paths.devTokens.create,{})
              .expect(200, {
                 'message' : 'There is a problem with the payments platform'
              })
              .end(done);

          });

          it('should return the account_id', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            build_get_request(paths.devTokens.show)
              .expect(200, {
                'account_id': ACCOUNT_ID
              })
              .end(done);
          });

          it('should fail if the csrf does not exist for the post', function (done){
            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            serverMock.post(PUBLIC_AUTH_PATH, {
              "account_id": ACCOUNT_ID,
              "description": "description"
            }).reply(200, {"token": TOKEN });

            build_form_post_request(paths.devTokens.create,{},true)
              .expect(200, {
                 'message' : 'There is a problem with the payments platform'
              })
              .end(done);
          });
      });
    });
 });
