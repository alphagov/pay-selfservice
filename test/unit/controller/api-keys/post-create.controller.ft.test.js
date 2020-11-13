'use strict'

const { expect } = require('chai')
const csrf = require('csrf')
const nock = require('nock')
const supertest = require('supertest')

const { getApp } = require('../../../../server')
const mockSession = require('../../../test-helpers/mock-session')
const userCreator = require('../../../test-helpers/user-creator')
const paths = require('../../../../app/paths')

const { PUBLIC_AUTH_URL, CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '182364'
const REQUEST_ID = 'unique-request-id'
const TOKEN_RESPONSE = {
  token: 'an-api-key'
}
const DESCRIPTION = 'Some words'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'description': ''
}

describe('POST to create an API key', () => {
  describe('without description', () => {
    let app
    let response
    before(done => {
      const user = mockSession.getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'tokens:create' }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)
      userCreator.mockUserResponse(user.toJson())

      nock(PUBLIC_AUTH_URL).post('',
        {
          'account_id': GATEWAY_ACCOUNT_ID,
          'description': '',
          'created_by': user.email,
          'token_type': 'CARD',
          'token_account_type': 'live',
          'type': 'API'
        }
      )
        .reply(200, TOKEN_RESPONSE)

      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox',
          type: 'live'
        })

      supertest(app)
        .post(paths.apiKeys.create)
        .set('Accept', 'application/json')
        .set('x-request-id', REQUEST_ID)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return with the API key', () => {
      expect(response.body.token).to.equal(TOKEN_RESPONSE.token)
    })
    it('and a blank description', () => {
      expect(response.body.description).to.equal('')
    })
  })

  describe('with a description', () => {
    let app
    let response
    before(done => {
      const user = mockSession.getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'tokens:create' }]
      })
      app = mockSession.getAppWithLoggedInUser(getApp(), user)
      userCreator.mockUserResponse(user.toJson())

      nock(PUBLIC_AUTH_URL).post('',
        {
          'account_id': GATEWAY_ACCOUNT_ID,
          'description': DESCRIPTION,
          'created_by': user.email,
          'token_type': 'CARD',
          'token_account_type': 'test',
          'type': 'API'
        }
      )
        .reply(200, TOKEN_RESPONSE)

      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
        .reply(200, {
          payment_provider: 'sandbox',
          type: 'test'
        })

      VALID_PAYLOAD.description = DESCRIPTION

      supertest(app)
        .post(paths.apiKeys.create)
        .set('Accept', 'application/json')
        .set('x-request-id', REQUEST_ID)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          response = res
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return with the API key', () => {
      expect(response.body.token).to.equal(TOKEN_RESPONSE.token)
    })
    it('and a blank description', () => {
      expect(response.body.description).to.equal(DESCRIPTION)
    })
  })
})
