'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {CONNECTOR_URL} = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Two factor authenticator configure index GET', () => {
  describe('when user currently has SMS configured', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      })
      nock(CONNECTOR_URL)
      .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, {
        payment_provider: 'sandbox'
      })

      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.user.twoFactorAuth.index)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it(`should include a link to My Profile`, () => {
      expect($('.link-back').attr('href')).to.equal(paths.user.profile)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).to.equal(paths.user.twoFactorAuth.index)
    })

    it(`should a button with “Use an authenticator app instead”`, () => {
      expect($('.button').text()).to.contain('Use an authenticator app instead')
    })
  })

  describe('when user currently has an APP configured', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}],
        second_factor: 'APP'
      })
      nock(CONNECTOR_URL)
      .get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`)
      .reply(200, {
        payment_provider: 'sandbox'
      })

      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.user.twoFactorAuth.index)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should return a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it(`should include a link to My Profile`, () => {
      expect($('.link-back').attr('href')).to.equal(paths.user.profile)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).to.equal(paths.user.twoFactorAuth.index)
    })

    it(`should a button with “Set up a different authenticator app”`, () => {
      expect($('.button').text()).to.contain('Set up a different authenticator app')
    })
  })
})
