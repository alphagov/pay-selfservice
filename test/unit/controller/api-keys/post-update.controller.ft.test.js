'use strict'

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
  csrfToken: csrf().create('123'),
  token_link: '398763986398739673',
  description: DESCRIPTION
}

describe('POST to update an API key description', () => {
  let app
  let response
  let session
  beforeAll(done => {
    const user = mockSession.getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'tokens:update' }]
    })
    session = mockSession.getMockSession(user)
    app = mockSession.createAppWithSession(getApp(), session)
    userCreator.mockUserResponse(user.toJson())

    nock(PUBLIC_AUTH_URL).put('',
      {
        token_link: '398763986398739673',
        description: DESCRIPTION
      }
    )
      .reply(200, TOKEN_RESPONSE)

    nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, {
        payment_provider: 'sandbox'
      })

    supertest(app)
      .post(paths.apiKeys.update)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .set('x-request-id', REQUEST_ID)
      .send(VALID_PAYLOAD)
      .end((err, res) => {
        response = res
        done(err)
      })
  })

  afterAll(() => {
    nock.cleanAll()
  })

  it('should redirect back to index', () => {
    expect(response.statusCode).toBe(302)
    expect(response.headers).to.have.property('location').toBe(paths.apiKeys.index)
  })

  it('should have success message', () => {
    expect(session.flash).toHaveProperty('generic')
    expect(session.flash.generic.length).toBe(1)
    expect(session.flash.generic[0]).toBe('The API key description was successfully updated')
  })
})
