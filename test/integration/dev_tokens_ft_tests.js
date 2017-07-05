const path = require('path')
require(path.join(__dirname, '/../test_helpers/serialize_mock.js'))
const userCreator = require(path.join(__dirname, '/../test_helpers/user_creator.js'))
const request = require('supertest')
const getApp = require(path.join(__dirname, '/../../server.js')).getApp
const nock = require('nock')
const csrf = require('csrf')
const paths = require(path.join(__dirname, '/../../app/paths.js'))
const session = require(path.join(__dirname, '/../test_helpers/mock_session.js'))

const gatewayAccountId = 98344
const TOKEN = '00112233'
const PUBLIC_AUTH_PATH = '/v1/frontend/auth'
const CONNECTOR_PATH = '/v1/frontend/accounts/{accountId}'

let app

const requestId = 'unique-request-id'
const aCorrelationHeader = {
  reqheaders: {'x-request-id': requestId}
}

const connectorMock = nock(process.env.CONNECTOR_URL, aCorrelationHeader)
const publicauthMock = nock(process.env.PUBLIC_AUTH_BASE, aCorrelationHeader)

function buildGetRequest (path) {
  return request(app)
    .get(path)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
}

function buildFormPostRequest (path, sendData, sendCSRF) {
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

function buildPutRequest (sendCSRF) {
  var data = {}
  sendCSRF = (sendCSRF === undefined) ? true : sendCSRF
  if (sendCSRF) {
    data.csrfToken = csrf().create('123')
  }
  data.token_link = '550e8400-e29b-41d4-a716-446655440000'
  data.description = 'token description'
  return request(app)
    .put(paths.devTokens.index)
    .set('Accept', 'application/json')
    .set('x-request-id', requestId)
    .send(data)
}

describe('Dev Tokens Endpoints', function () {
  describe('The /tokens/revoked endpoint (read revoked tokens)', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'tokens-revoked:read'
      var user = session.getUser({
        gateway_account_ids: [gatewayAccountId], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should return an empty list of tokens if no tokens have been revoked yet', function (done) {
      publicauthMock.get(PUBLIC_AUTH_PATH + '/' + gatewayAccountId + '?state=revoked')
        .reply(200, {
          'account_id': gatewayAccountId
        })

      buildGetRequest(paths.devTokens.revoked)
        .expect(200, {
          'active': false,
          'header': 'revoked-tokens',
          'token_state': 'revoked',
          'tokens': [],
          'tokens_singular': false,
          'permissions': {
            'tokens_revoked_read': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should return the account_id and the token list for the only revoked token', function (done) {
      publicauthMock.get(PUBLIC_AUTH_PATH + '/' + gatewayAccountId + '?state=revoked')
        .reply(200, {
          'account_id': gatewayAccountId,
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'token 1', 'revoked': '18 Oct 2015'}]
        })

      buildGetRequest(paths.devTokens.revoked)
        .expect(function (res) {
          if (!res.body.tokens[0].csrfToken) throw new Error('no token')
          delete res.body.tokens[0].csrfToken
        })
        .expect(200, {
          'active': false,
          'header': 'revoked-tokens',
          'token_state': 'revoked',
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'token 1', 'revoked': '18 Oct 2015'}],
          'tokens_singular': true,
          'permissions': {
            'tokens_revoked_read': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should return the account_id and the token list for multiple revoked tokens', function (done) {
      publicauthMock.get(PUBLIC_AUTH_PATH + '/' + gatewayAccountId + '?state=revoked')
        .reply(200, {
          'account_id': gatewayAccountId,
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'description token 1', 'revoked': '18 Oct 2015'},
            {'token_link': '550e8400-e29b-41d4-a716-446655441234', 'description': 'description token 2', 'revoked': '19 Oct 2015'}]
        })

      buildGetRequest(paths.devTokens.revoked)
        .expect(function (res) {
          if (!res.body.tokens[0].csrfToken) throw new Error('no token')
          delete res.body.tokens[0].csrfToken
          if (!res.body.tokens[1].csrfToken) throw new Error('no token')
          delete res.body.tokens[1].csrfToken
        })
        .expect(200, {
          'active': false,
          'header': 'revoked-tokens',
          'token_state': 'revoked',
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'description token 1', 'revoked': '18 Oct 2015'},
            {'token_link': '550e8400-e29b-41d4-a716-446655441234', 'description': 'description token 2', 'revoked': '19 Oct 2015'}],
          'tokens_singular': false,
          'permissions': {
            'tokens_revoked_read': true
          },
          navigation: true
        })
        .end(done)
    })
  })

  describe('The GET /tokens endpoint (read active tokens)', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'tokens-active:read'
      var user = session.getUser({
        gateway_account_ids: [gatewayAccountId], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should return an empty list of tokens if no tokens have been issued yet', function (done) {
      publicauthMock.get(PUBLIC_AUTH_PATH + '/' + gatewayAccountId)
        .reply(200, {
          'account_id': gatewayAccountId
        })

      buildGetRequest(paths.devTokens.index)
        .expect(200, {
          'active': true,
          'header': 'available-tokens',
          'token_state': 'active',
          'tokens': [],
          'tokens_singular': false,
          'permissions': {
            'tokens_active_read': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should return the account_id and the token list for the only already-issued token', function (done) {
      publicauthMock.get(PUBLIC_AUTH_PATH + '/' + gatewayAccountId)
        .reply(200, {
          'account_id': gatewayAccountId,
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'token 1'}]
        })

      buildGetRequest(paths.devTokens.index)
        .expect(function (res) {
          if (!res.body.tokens[0].csrfToken) throw new Error('no token')
          delete res.body.tokens[0].csrfToken
        })
        .expect(200, {
          'active': true,
          'header': 'available-tokens',
          'token_state': 'active',
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'token 1'}],
          'tokens_singular': true,
          'permissions': {
            'tokens_active_read': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should return the account_id and the token list for already-issued tokens', function (done) {
      publicauthMock.get(PUBLIC_AUTH_PATH + '/' + gatewayAccountId)
        .reply(200, {
          'account_id': gatewayAccountId,
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'description token 1'},
            {'token_link': '550e8400-e29b-41d4-a716-446655441234', 'description': 'description token 2'}]
        })

      buildGetRequest(paths.devTokens.index)
        .expect(function (res) {
          if (!res.body.tokens[0].csrfToken) throw new Error('no token')
          delete res.body.tokens[0].csrfToken
          if (!res.body.tokens[1].csrfToken) throw new Error('no token')
          delete res.body.tokens[1].csrfToken
        })
        .expect(200, {
          'active': true,
          'header': 'available-tokens',
          'token_state': 'active',
          'tokens': [{'token_link': '550e8400-e29b-41d4-a716-446655440000', 'description': 'description token 1'},
            {'token_link': '550e8400-e29b-41d4-a716-446655441234', 'description': 'description token 2'}],
          'tokens_singular': false,
          'permissions': {
            'tokens_active_read': true
          },
          navigation: true
        })
        .end(done)
    })
  })

  describe('The PUT /tokens endpoint (update token - description)', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'tokens:update'
      var user = session.getUser({
        gateway_account_id: gatewayAccountId, permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should update the description', function (done) {
      publicauthMock.put(PUBLIC_AUTH_PATH, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000',
        'description': 'token description'
      }).reply(200, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000',
        'description': 'token description',
        'created_by': 'test-user',
        'issued_date': '18 Feb 2016 - 12:44',
        'last_used': '23 Feb 2016 - 19:44'
      })

      buildPutRequest()
        .expect(function (res) {
          if (!res.body.csrfToken) throw new Error('no token')
          delete res.body.csrfToken
        })
        .expect(200, {
          'token_link': '550e8400-e29b-41d4-a716-446655440000',
          'description': 'token description',
          'created_by': 'test-user',
          'issued_date': '18 Feb 2016 - 12:44',
          'last_used': '23 Feb 2016 - 19:44',
          'permissions': {
            'tokens_update': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should not update the description without csrf', function (done) {
      publicauthMock.put(PUBLIC_AUTH_PATH, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000',
        'description': 'token description'
      }).reply(200, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000',
        'description': 'token description'
      })

      buildPutRequest(false)
        .expect(400, {
          'message': 'There is a problem with the payments platform'
        })
        .end(done)
    })

    it('should forward the error status code when updating the description', function (done) {
      publicauthMock.put(PUBLIC_AUTH_PATH, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000',
        'description': 'token description'
      }).reply(400, {})

      buildPutRequest()
        .expect(400, {})
        .end(done)
    })

    it('should send 500 if any error happens while updating the resource', function (done) {
      // No serverMock defined on purpose to mock a network failure
      buildPutRequest()
        .expect(500, {})
        .end(done)
    })
  })
  describe('The DELETE /tokens endpoint (delete tokens)', function () {
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'tokens:delete'
      var user = session.getUser({
        gateway_account_ids: [gatewayAccountId], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should revoke and existing token', function (done) {
      publicauthMock.delete(PUBLIC_AUTH_PATH + '/' + gatewayAccountId, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000'
      }).reply(200, {'revoked': '15 Oct 2015'})

      request(app)
        .delete(paths.devTokens.index + '?token_link=550e8400-e29b-41d4-a716-446655440000')
        .set('x-request-id', requestId)
        .send({ csrfToken: csrf().create('123') })
        .expect(200, {'revoked': '15 Oct 2015'})
        .end(done)
    })

    it('should fail if no csrf', function (done) {
      publicauthMock.delete(PUBLIC_AUTH_PATH + '/' + gatewayAccountId, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000'
      }).reply(200, {'revoked': '15 Oct 2015'})

      request(app)
        .delete(paths.devTokens.index + '?token_link=550e8400-e29b-41d4-a716-446655440000')
        .set('x-request-id', requestId)
        .set('Accept', 'application/json')
        .expect(400, {message: 'There is a problem with the payments platform'})
        .end(done)
    })

    it('should forward the error status code when revoking the token', function (done) {
      publicauthMock.delete(PUBLIC_AUTH_PATH + '/' + gatewayAccountId, {
        'token_link': '550e8400-e29b-41d4-a716-446655440000'
      }).reply(400, {})

      request(app)
        .delete(paths.devTokens.index + '?token_link=550e8400-e29b-41d4-a716-446655440000')
        .set('x-request-id', requestId)
        .send({ csrfToken: csrf().create('123') })
        .expect(400, {})
        .end(done)
    })

    it('should send 500 if any error happens while updating the resource', function (done) {
      // No serverMock defined on purpose to mock a network failure
      request(app)
        .delete(paths.devTokens.index)
        .set('x-request-id', requestId)
        .send({
          token_link: '550e8400-e29b-41d4-a716-446655440000',
          csrfToken: csrf().create('123')

        })
        .expect(500, {})
        .end(done)
    })
  })

  describe('The /tokens/generate endpoint (create tokens and show generated token)', function () {
    var user
    afterEach(function () {
      nock.cleanAll()
      app = null
    })

    beforeEach(function (done) {
      let permissions = 'tokens:create'
      user = session.getUser({
        gateway_account_ids: [gatewayAccountId], permissions: [permissions]
      })
      app = session.getAppWithLoggedInUser(getApp(), user)

      userCreator.mockUserResponse(user.toJson(), done)
    })

    it('should create a token successfully', function (done) {
      publicauthMock.post(PUBLIC_AUTH_PATH, {
        'account_id': gatewayAccountId,
        'description': 'description',
        'created_by': user.email
      }).reply(200, {'token': TOKEN})

      buildFormPostRequest(paths.devTokens.create, {'description': 'description'}, true)
        .expect(200, {
          'token': TOKEN,
          'description': 'description',
          'permissions': {
            'tokens_create': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should only return the account_id', function (done) {
      connectorMock.get(CONNECTOR_PATH.replace('{accountId}', gatewayAccountId)).reply(200)

      buildGetRequest(paths.devTokens.show)
        .expect(200, {
          'account_id': gatewayAccountId,
          'permissions': {
            'tokens_create': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should fail if the account does not exist for a POST', function (done) {
      connectorMock.get(CONNECTOR_PATH.replace('{accountId}', gatewayAccountId)).reply(400)

      publicauthMock.post(PUBLIC_AUTH_PATH, {
        'account_id': gatewayAccountId,
        'description': 'description'
      }).reply(200, {
        'token': TOKEN,
        navigation: true
      })

      buildFormPostRequest(paths.devTokens.create, {})
        .expect(500, {
          'message': 'There is a problem with the payments platform'
        })
        .end(done)
    })

    it('should return the account_id', function (done) {
      connectorMock.get(CONNECTOR_PATH.replace('{accountId}', gatewayAccountId)).reply(200)

      buildGetRequest(paths.devTokens.show)
        .expect(200, {
          'account_id': gatewayAccountId,
          'permissions': {
            'tokens_create': true
          },
          navigation: true
        })
        .end(done)
    })

    it('should fail if the csrf does not exist for the post', function (done) {
      connectorMock.get(CONNECTOR_PATH.replace('{accountId}', gatewayAccountId)).reply(200)

      publicauthMock.post(PUBLIC_AUTH_PATH, {
        'account_id': gatewayAccountId,
        'description': 'description'
      }).reply(200, {'token': TOKEN,
        navigation: true})

      buildFormPostRequest(paths.devTokens.create, {}, true)
        .expect(500, {
          'message': 'There is a problem with the payments platform'
        })
        .end(done)
    })
  })
})
