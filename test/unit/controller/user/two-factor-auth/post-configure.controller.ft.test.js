'use strict'

const supertest = require('supertest')
const csrf = require('csrf')
const { expect } = require('chai')
const nock = require('nock')

const { getApp } = require('../../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../../test-helpers/mock-session')
const paths = require('../../../../../app/paths')
const { ADMINUSERS_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'transactions:read' }]
})

describe('Two factor authenticator configure page POST', () => {
  describe('if code entered is correct', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)

      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/activate`)
        .reply(200)
    })

    before('Act', done => {
      supertest(app)
        .post(paths.user.profile.twoFactorAuth.configure)
        .send({
          csrfToken: csrf().create('123'),
          code: '398262'
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

    it('should redirect to the profile page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.user.profile.index)
    })
  })

  describe('if code entered is incorrect', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)

      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/activate`)
        .reply(401)
    })

    before('Act', done => {
      supertest(app)
        .post(paths.user.profile.twoFactorAuth.configure)
        .send({
          csrfToken: csrf().create('123'),
          code: ''
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
      expect(result.headers).to.have.property('location').to.equal(paths.user.profile.twoFactorAuth.configure)
    })

    it('should have a recovered object stored on the session containing errors', () => {
      const recovered = session.pageData.configureTwoFactorAuthMethodRecovered
      expect(recovered).to.have.property('errors')
      expect(recovered.errors).to.have.property('verificationCode')
    })
  })
})
