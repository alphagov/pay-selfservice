'use strict'

const supertest = require('supertest')
const csrf = require('csrf')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { ADMINUSERS_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'transactions:read' }]
})

describe('Two factor authenticator configure page POST', () => {
  describe('if code entered is correct', () => {
    let result, session, app
    beforeAll(() => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)

      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/activate`)
        .reply(200)
    })

    beforeAll(done => {
      supertest(app)
        .post(paths.user.twoFactorAuth.configure)
        .send({
          csrfToken: csrf().create('123'),
          code: '398262'
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect to the profile page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.user.profile)
    })
  })

  describe('if code entered is incorrect', () => {
    let result, session, app
    beforeAll(() => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)

      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/activate`)
        .reply(401)
    })

    beforeAll(done => {
      supertest(app)
        .post(paths.user.twoFactorAuth.configure)
        .send({
          csrfToken: csrf().create('123'),
          code: ''
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    afterAll(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 302', () => {
      expect(result.statusCode).toBe(302)
    })

    it('should redirect to the configure page', () => {
      expect(result.headers).to.have.property('location').toBe(paths.user.twoFactorAuth.configure)
    })

    it(
      'should have a recovered object stored on the session containing errors',
      () => {
        const recovered = session.pageData.configureTwoFactorAuthMethodRecovered
        expect(recovered).toHaveProperty('errors')
        expect(recovered.errors).toHaveProperty('verificationCode')
      }
    )
  })
})
