'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const {CONNECTOR_URL} = process.env
const GATEWAY_ACCOUNT_ID = '929'

describe('Create payment link information controller', () => {
  describe('if landing here for the first time', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.information)
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

    it(`should include a cancel link linking to the Create payment link index`, () => {
      expect($('.cancel').attr('href')).to.equal(paths.paymentLinks.start)
    })

    it(`should have itself as the form action`, () => {
      expect($('form').attr('action')).to.equal(paths.paymentLinks.information)
    })

    it(`should have blank value in the Title input`, () =>
      expect($(`input[name='payment-link-title']`).val()).to.equal('')
    )

    it(`should have blank value in the Details textarea`, () =>
      expect($(`textarea[name='payment-link-description']`).val()).to.equal('')
    )
  })

  describe('if returning here to change fields', () => {
    let $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{name: 'transactions:read'}]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      lodash.set(session, 'pageData.createPaymentLink', {
        paymentLinkTitle: 'Pay for an offline service',
        paymentLinkDescription: 'Hello world'
      })
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.information)
        .end((err, res) => {
          $ = cheerio.load(res.text)
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it(`should pre-set the value of the Title input to pre-existing data if present in the session`, () =>
      expect($(`input[name='payment-link-title']`).val()).to.equal(session.pageData.createPaymentLink.paymentLinkTitle)
    )

    it(`should pre-set the value of the Details textarea to pre-existing data if present in the session`, () =>
      expect($(`textarea[name='payment-link-description']`).val()).to.equal(session.pageData.createPaymentLink.paymentLinkDescription)
    )
  })
})
