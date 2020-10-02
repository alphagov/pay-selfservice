'use strict'

const nock = require('nock')
const supertest = require('supertest')

const { getApp } = require('../../../../server')
const mockSession = require('../../../test-helpers/mock-session')
const userCreator = require('../../../test-helpers/user-creator')
const paths = require('../../../../app/paths')

const { PUBLIC_AUTH_URL, CONNECTOR_URL } = process.env

const GATEWAY_ACCOUNT_ID = '182364'

const TOKEN_1 = {
  issued_date: '14 May 2018 - 15:33',
  last_used: null,
  token_link: '02227212-88fd-4b42-a9fc-671ae7155cd0',
  description: 'gg',
  token_type: 'CARD',
  revoked: '14 May 2018 - 15:34',
  created_by: 'TKAS4OIpm2qpC7qxEP45Uuql410HQqmE@example.com'
}

const TOKEN_2 = {
  issued_date: '14 May 2018 - 15:33',
  last_used: null,
  token_link: '02227212-88fd-4b42-a9fc-4763733353',
  description: 'gg',
  token_type: 'CARD',
  revoked: '14 May 2018 - 15:34',
  created_by: 'TKAS4OIpm2qpC7qxEP45Uuql410HQqmE@example.com'
}

const mockGetRevokedAPIKeys = gatewayAccountId => {
  return nock(PUBLIC_AUTH_URL).get(`/${gatewayAccountId}?state=revoked`)
}

describe('Revoked API keys index', () => {
  let app
  beforeAll(() => {
    const user = mockSession.getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'tokens-revoked:read' }]
    })
    app = mockSession.getAppWithLoggedInUser(getApp(), user)
    userCreator.mockUserResponse(user.toJson())
  })

  describe('when no API keys exist', () => {
    let response
    beforeAll(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetRevokedAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, [])

      supertest(app)
        .get(paths.apiKeys.revoked)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return API keys with state revoked', () => {
      expect(response.body.token_state).toBe('revoked')
    })
    it('should not return any API keys', () => {
      expect(response.body.tokens.length).toBe(0)
    })
  })

  describe('when one API key exists', () => {
    let response
    beforeAll(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetRevokedAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, { tokens: [TOKEN_1] })

      supertest(app)
        .get(paths.apiKeys.revoked)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return API keys with state revoked', () => {
      expect(response.body.token_state).toBe('revoked')
    })

    it('should return one API key', () => {
      expect(response.body.tokens.length).toBe(1)
    })

    it('should return tokens_singular as true', () => {
      expect(response.body.tokens_singular).toBe(true)
    })
  })

  describe('when more than one API key exists', () => {
    let response
    beforeAll(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox'
        })
      mockGetRevokedAPIKeys(GATEWAY_ACCOUNT_ID).reply(200, { tokens: [TOKEN_1, TOKEN_2] })

      supertest(app)
        .get(paths.apiKeys.revoked)
        .set('Accept', 'application/json')
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    afterAll(() => {
      nock.cleanAll()
    })

    it('should return API keys with state revoked', () => {
      expect(response.body.token_state).toBe('revoked')
    })

    it('should return two API key', () => {
      expect(response.body.tokens.length).toBe(2)
    })

    it('should return tokens_singular as false', () => {
      expect(response.body.tokens_singular).toBe(false)
    })
  })
})
