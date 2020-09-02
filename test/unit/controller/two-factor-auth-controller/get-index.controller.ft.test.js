'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Two factor authenticator configure index GET', () => {
  describe('when user currently has SMS configured', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }]
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
      expect($('.govuk-back-link').attr('href')).to.equal(paths.user.profile)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).to.equal(paths.user.twoFactorAuth.index)
    })

    it(`should a button with “Use an authenticator app instead”`, () => {
      expect($('.govuk-button').text()).to.contain('Use an authenticator app instead')
    })
  })

  describe('when user currently has an APP configured', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'transactions:read' }],
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
      expect($('.govuk-back-link').attr('href')).to.equal(paths.user.profile)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).to.equal(paths.user.twoFactorAuth.index)
    })

    it(`should a radio with “A different authenticator app”`, () => {
      expect($('label[for="two-fa-method"]').text()).to.contain('A different authenticator app')
    })

    it(`should a radio with “By text message”`, () => {
      expect($('label[for="two-fa-method-2"]').text()).to.contain('By text message')
    })
  })
})
