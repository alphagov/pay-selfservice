'use strict'

// NPM dependencies
const supertest = require('supertest')
const csrf = require('csrf')
const {expect} = require('chai')
const nock = require('nock')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {ADMINUSERS_URL} = process.env
const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{name: 'transactions:read'}]
})

describe('Two factor authenticator configure index POST', () => {
  let result, session, app
  before('Arrange', () => {
    session = getMockSession(VALID_USER)
    app = createAppWithSession(getApp(), session)

    nock(ADMINUSERS_URL)
      .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/provision`)
      .reply(200)
  })

  before('Act', done => {
    supertest(app)
      .post(paths.user.twoFactorAuth.index)
      .send({
        csrfToken: csrf().create('123')
      })
      .end((err, res) => {
        result = res
        done(err)
      })
  })
  after(() => {
    nock.cleanAll()
  })

  it('should return a statusCode of 302', () => {
    expect(result.statusCode).to.equal(302)
  })

  it('should redirect to the configure page', () => {
    expect(result.headers).to.have.property('location').to.equal(paths.user.twoFactorAuth.configure)
  })
})
