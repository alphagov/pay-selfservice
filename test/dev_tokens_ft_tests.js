process.env.SESSION_ENCRYPTION_KEY = 'naskjwefvwei72rjkwfmjwfi72rfkjwefmjwefiuwefjkbwfiu24fmjbwfk';

var request = require('supertest');
var app = require(__dirname + '/../server.js').getApp;
var winston = require('winston');
var portfinder = require('portfinder');
var nock = require('nock');
var cookie = require(__dirname + '/utils/session.js');
var should = require('chai').should();

var ACCOUNT_ID = '23144323';
var TOKEN = '00112233';
var TOKEN_PATH = '/tokens';
var TOKEN_GENERATION_GET_PATH = '/tokens/{accountId}/generate';
var TOKEN_GENERATION_POST_PATH = '/tokens/generate';
var PUBLIC_AUTH_PATH = '/v1/frontend/auth';
var CONNECTOR_PATH = '/v1/api/accounts/{accountId}';

portfinder.getPort(function(err, freePort) {

  var localServer = 'http://localhost:' + freePort;
  var serverMock = nock(localServer);

  describe('Dev Tokens Endpoints', function() {

      beforeEach(function() {
        process.env.PUBLIC_AUTH_URL = localServer + PUBLIC_AUTH_PATH;
        process.env.CONNECTOR_URL = localServer;
        nock.cleanAll();
      });

      before(function () {
        // Disable logging.
        winston.level = 'none';
      });

      describe('The /tokens endpoint', function() {

        it('should fail if the account does not exist', function (done){

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(400);

          request(app)
            .get(TOKEN_PATH + '/' + ACCOUNT_ID)
            .set('Accept', 'application/json')
            .expect(200, {
               'message' : 'There is a problem with the payments platform'
            })
            .expect(function(res) {
                should.not.exist(res.headers['set-cookie']);
                var session = cookie.decrypt(res);
                should.not.exist(session.token);
                should.not.exist(session.description);
            })
            .end(done);
        });

        it('should return the account_id and an empty list of tokens if no tokens have been issued yet', function (done){

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID)
            .reply(200, {
                "account_id": ACCOUNT_ID,
                "tokens": []
            });

          request(app)
            .get(TOKEN_PATH + '/' + ACCOUNT_ID)
            .set('Accept', 'application/json')
            .expect(200, {
              'account_id': ACCOUNT_ID,
              'tokens': []
            })
            .expect(function(res) {
                should.not.exist(res.headers['set-cookie']);
                var session = cookie.decrypt(res);
                should.not.exist(session.token);
                should.not.exist(session.description);
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

          request(app)
            .get(TOKEN_PATH + '/' + ACCOUNT_ID)
            .set('Accept', 'application/json')
            .expect(200, {
              'account_id': ACCOUNT_ID,
              'tokens': [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1"}]
            })
            .expect(function(res) {
                should.not.exist(res.headers['set-cookie']);
                var session = cookie.decrypt(res);
                should.not.exist(session.token);
                should.not.exist(session.description);
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

          request(app)
            .get(TOKEN_PATH + '/' + ACCOUNT_ID)
            .set('Accept', 'application/json')
            .expect(200, {
              'account_id': ACCOUNT_ID,
              'tokens': [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"description token 1"},
                         {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"description token 2"}]
            })
            .expect(function(res) {
                should.not.exist(res.headers['set-cookie']);
                var session = cookie.decrypt(res);
                should.not.exist(session.token);
                should.not.exist(session.description);
            })
            .end(done);
        });

        it('should include revoked date in case the token has been already revoked', function (done){

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID)
            .reply(200, {
                "account_id": ACCOUNT_ID,
                "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1", "revoked": "18 Oct 2015"},
                           {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"token 1"}]
            });

          request(app)
            .get(TOKEN_PATH + '/' + ACCOUNT_ID)
            .set('Accept', 'application/json')
            .expect(200, {
              'account_id': ACCOUNT_ID,
              'tokens': [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1", 'revoked': "18 Oct 2015"},
                         {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"token 1"}]
            })
            .expect(function(res) {
                should.not.exist(res.headers['set-cookie']);
                var session = cookie.decrypt(res);
                should.not.exist(session.token);
                should.not.exist(session.description);
            })
            .end(done);
        });

        it('should include all tokens even if all have been revoked', function (done){

          serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

          serverMock.get(PUBLIC_AUTH_PATH + "/" + ACCOUNT_ID)
            .reply(200, {
                "account_id": ACCOUNT_ID,
                "tokens": [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1", "revoked": "18 Oct 2015"},
                           {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"token 2", "revoked": "18 Oct 2015"}]
            });

          request(app)
            .get(TOKEN_PATH + '/' + ACCOUNT_ID)
            .set('Accept', 'application/json')
            .expect(200, {
              'account_id': ACCOUNT_ID,
              'tokens': [{"token_link":"550e8400-e29b-41d4-a716-446655440000", "description":"token 1", 'revoked': "18 Oct 2015"},
                         {"token_link":"550e8400-e29b-41d4-a716-446655441234", "description":"token 2", "revoked": "18 Oct 2015"}]
            })
            .expect(function(res) {
                should.not.exist(res.headers['set-cookie']);
                var session = cookie.decrypt(res);
                should.not.exist(session.token);
                should.not.exist(session.description);
            })
            .end(done);
        });

        it('should update the description', function (done){

          serverMock.put(PUBLIC_AUTH_PATH, {
            "token_link": '550e8400-e29b-41d4-a716-446655440000',
            "description": "token description"
          }).reply(200, {
            "token_link": '550e8400-e29b-41d4-a716-446655440000',
            "description": "token description"
          });

          request(app)
            .put(TOKEN_PATH)
            .set('Accept', 'application/json')
            .send({
              'token_link': '550e8400-e29b-41d4-a716-446655440000',
              'description': "token description"
            })
            .expect(200, {
              'token_link': '550e8400-e29b-41d4-a716-446655440000',
              'description': "token description"
            })
            .end(done);

        });

        it('should forward the error status code when updating the description', function (done){

          serverMock.put(PUBLIC_AUTH_PATH, {
            "token_link": '550e8400-e29b-41d4-a716-446655440000',
            "description": "token description"
          }).reply(400, {});

          request(app)
            .put(TOKEN_PATH)
            .set('Accept', 'application/json')
            .send({
              'token_link': '550e8400-e29b-41d4-a716-446655440000',
              'description': "token description"
            })
            .expect(400, {})
            .end(done);

        });

        it('should send 500 if any error happens while updating the resource', function (done){

          // No serverMock defined on purpose to mock a network failure

          request(app)
            .put(TOKEN_PATH)
            .set('Accept', 'application/json')
            .send({
              'token_link': '550e8400-e29b-41d4-a716-446655440000',
              'description': "token description"
            })
            .expect(500, {})
            .end(done);

        });

        it('should revoke and existing token', function (done){

          serverMock.delete(PUBLIC_AUTH_PATH + "/1", {
            "token_link": '550e8400-e29b-41d4-a716-446655440000'
          }).reply(200, {"revoked": "15 Oct 2015"});

          request(app)
            .delete(TOKEN_PATH + "/1?token_link=550e8400-e29b-41d4-a716-446655440000")
            .expect(200, {"revoked": "15 Oct 2015"})
            .end(done);

        });

        it('should forward the error status code when revoking the token', function (done){

          serverMock.delete(PUBLIC_AUTH_PATH + "/1", {
            "token_link": '550e8400-e29b-41d4-a716-446655440000'
          }).reply(400, {});

          request(app)
            .delete(TOKEN_PATH + "/1?token_link=550e8400-e29b-41d4-a716-446655440000")
            .expect(400, {})
            .end(done);

        });

        it('should send 500 if any error happens while updating the resource', function (done){

          // No serverMock defined on purpose to mock a network failure

          request(app)
            .delete(TOKEN_PATH + "/1")
            .send({
              'token_link': '550e8400-e29b-41d4-a716-446655440000'
            })
            .expect(500, {})
            .end(done);

        });

      });

      describe('The /tokens/generate endpoint', function() {

         it('should fail if the account does not exist for a GET', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(400);

            request(app)
              .get(TOKEN_GENERATION_GET_PATH.replace("{accountId}", ACCOUNT_ID))
              .set('Accept', 'application/json')
              .expect(200, {
                 'message' : 'There is a problem with the payments platform'
              })
              .expect(function(res) {
                  should.not.exist(res.headers['set-cookie']);
                  var session = cookie.decrypt(res);
                  should.not.exist(session.token);
                  should.not.exist(session.description);
              })
              .end(done);

          });

          it('should only return the account_id', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            request(app)
              .get(TOKEN_GENERATION_GET_PATH.replace("{accountId}", ACCOUNT_ID))
              .set('Accept', 'application/json')
              .expect(200, {
                'account_id': ACCOUNT_ID
              })
              .expect(function(res) {
                  should.not.exist(res.headers['set-cookie']);
                  var session = cookie.decrypt(res);
                  should.not.exist(session.token);
                  should.not.exist(session.description);
              })
              .end(done);
          });

          it('should fail if the account does not exist for a POST', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(400);

            serverMock.post(PUBLIC_AUTH_PATH, {
              "account_id": ACCOUNT_ID,
              "description": "description"
            }).reply(200, {"token": TOKEN });

            request(app)
              .post(TOKEN_GENERATION_POST_PATH)
              .set('Content-Type', 'application/x-www-form-urlencoded')
              .set('Accept', 'application/json')
              .send({
                'accountId': ACCOUNT_ID,
                'description': "description"
              })
              .expect(200, {
                 'message' : 'There is a problem with the payments platform'
              })
              .expect(function(res) {
                  should.not.exist(res.headers['set-cookie']);
                  var session = cookie.decrypt(res);
                  should.not.exist(session.token);
                  should.not.exist(session.description);
              })
              .end(done);

          });

          it('should redirect the user and place the new token in the session', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            serverMock.post(PUBLIC_AUTH_PATH, {
              "account_id": ACCOUNT_ID,
              "description": "description"
            }).reply(200, {"token": TOKEN });

            request(app)
              .post(TOKEN_GENERATION_POST_PATH)
              .set('Content-Type', 'application/x-www-form-urlencoded')
              .set('Accept', 'application/json')
              .send({
                  'accountId': ACCOUNT_ID,
                  'description': "description"
               })
               .expect(303, {})
               .expect(function(res) {
                  should.exist(res.headers['set-cookie']);
                  var session = cookie.decrypt(res);
                  should.equal(session.token, TOKEN);
                  should.equal(session.description, "description");
                })
               .expect('Location', TOKEN_GENERATION_GET_PATH.replace("{accountId}", ACCOUNT_ID))
               .end(done);
          });

          it('should fail when posting if there is already a token in the session', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            serverMock.post(PUBLIC_AUTH_PATH, {
              "account_id": ACCOUNT_ID,
              "description": "description"
            }).reply(200, {"token": TOKEN });

            request(app)
              .post(TOKEN_GENERATION_POST_PATH)
              .set('Content-Type', 'application/x-www-form-urlencoded')
              .set('Accept', 'application/json')
              .set('Cookie', ['session_state=' + cookie.create(TOKEN)])
              .send({
                  'accountId': ACCOUNT_ID,
                  'description': "description"
               })
               .expect(200, {
                  'message' : 'There is a problem with the payments platform'
               })
               .expect(function(res) {
                  should.exist(res.headers['set-cookie']);
                  var session = cookie.decrypt(res);
                  should.not.exist(session.token);
                  should.not.exist(session.description);
               })
               .end(done);
          });

          it('should return the account_id and the new token if the token is in the session, and then clear the session', function (done){

            serverMock.get(CONNECTOR_PATH.replace("{accountId}",ACCOUNT_ID)).reply(200);

            request(app)
              .get(TOKEN_GENERATION_GET_PATH.replace("{accountId}", ACCOUNT_ID))
              .set('Accept', 'application/json')
              .set('Cookie', ['session_state=' + cookie.create(TOKEN)])
              .expect(200, {
                'account_id': ACCOUNT_ID,
                'token': TOKEN,
                'description': 'description'
              })
              .expect(function(res) {
                  should.exist(res.headers['set-cookie']);
                  var session = cookie.decrypt(res);
                  should.not.exist(session.token);
                  should.not.exist(session.description);
              })
              .end(done);
          });

      });

    });

 });
