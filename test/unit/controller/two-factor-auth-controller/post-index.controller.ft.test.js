'use strict'

// NPM dependencies
const supertest = require('supertest')
const csrf = require('csrf')
const { expect } = require('chai')
const nock = require('nock')

// Local dependencies
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { ADMINUSERS_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'transactions:read' }]
})

const VALID_USER_RESPONSE = {
  external_id: '121391373c1844dd99cb3416b70785c8',
  username: 'm87bmh',
  email: 'm87bmh@example.com',
  service_roles: [],
  otpKey: '2994',
  telephoneNumber: '940583',
  disabled: false,
  sessionVersion: 0,
  features: '',
  secondFactor: 'SMS',
  provisionalOtpKey: '60400'
}

describe('Two factor authenticator configure index POST', () => {
  describe('to set up another app', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/provision`)
        .reply(200, VALID_USER_RESPONSE)
    })

    before('Act', done => {
      supertest(app)
        .post(paths.user.twoFactorAuth.index)
        .send({
          csrfToken: csrf().create('123'),
          'two-fa-method': 'APP'
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

  describe('to set up SMS', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor/provision`)
        .reply(200, VALID_USER_RESPONSE)
      nock(ADMINUSERS_URL)
        .post(`/v1/api/users/${VALID_USER.externalId}/second-factor`)
        .reply(200)
    })

    before('Act', done => {
      supertest(app)
        .post(paths.user.twoFactorAuth.index)
        .send({
          csrfToken: csrf().create('123'),
          'two-fa-method': 'SMS'
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
})
