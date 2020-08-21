'use strict'

// NPM dependencies
const { expect } = require('chai')
const csrf = require('csrf')
const nock = require('nock')
const supertest = require('supertest')

// Local dependencies
const { getApp } = require('../../../../server')
const mockSession = require('../../../test-helpers/mock-session')
const userCreator = require('../../../test-helpers/user-creator')
const paths = require('../../../../app/paths')

const { PUBLIC_AUTH_URL, CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '182364'
const REQUEST_ID = 'unique-request-id'
const TOKEN_RESPONSE = {
  deleted: true
}
const VALID_PAYLOAD = {
  csrfToken: csrf().create('123'),
  token_link: '398763986398739673'
}

describe('POST to revoke an API key', () => {
  let app
  let response
  let session
  before(done => {
    const user = mockSession.getUser({
      gateway_account_ids: [GATEWAY_ACCOUNT_ID], permissions: [{ name: 'tokens:delete' }]
    })
    session = mockSession.getMockSession(user)
    app = mockSession.createAppWithSession(getApp(), session)
    userCreator.mockUserResponse(user.toJson())

    nock(PUBLIC_AUTH_URL).delete(`/${GATEWAY_ACCOUNT_ID}`,
      {
        token_link: '398763986398739673'
      }
    )
      .reply(200, TOKEN_RESPONSE)

    nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, {
        payment_provider: 'sandbox'
      })

    supertest(app)
      .post(paths.apiKeys.revoke)
      .set('Accept', 'application/json')
      .set('Content-Type', 'application/x-www-form-urlencoded')
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

  it('should redirect back to index', () => {
    expect(response.statusCode).to.equal(302)
    expect(response.headers).to.have.property('location').to.equal(paths.apiKeys.index)
  })

  it('should have success message', () => {
    expect(session.flash).to.have.property('generic')
    expect(session.flash.generic.length).to.equal(1)
    expect(session.flash.generic[0]).to.equal('The API key was successfully revoked')
  })
})
