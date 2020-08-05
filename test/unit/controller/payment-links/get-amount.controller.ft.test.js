'use strict'

// NPM dependencies
const supertest = require('supertest')
const { expect } = require('chai')
const cheerio = require('cheerio')
const nock = require('nock')
const lodash = require('lodash')

// Local dependencies
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { CONNECTOR_URL } = process.env
const GATEWAY_ACCOUNT_ID = '929'
const { penceToPounds } = require('../../../../app/utils/currency-formatter')

describe('Create payment link amount controller', () => {
  describe('if landing here for the first time', () => {
    let result, $, session
    before(done => {
      const user = getUser({
        gateway_account_ids: [GATEWAY_ACCOUNT_ID],
        permissions: [{ name: 'tokens:create' }]
      })
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
        payment_provider: 'sandbox'
      })
      session = getMockSession(user)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.paymentLinks.amount)
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
      expect($('form').attr('action')).to.equal(paths.paymentLinks.amount)
    })

    it(`should have no checked radio buttons`, () =>
      expect($(`input[type="radio"]:checked`).length).to.equal(0)
    )

    it(`should have blank value in the amount input`, () =>
      expect($(`input[name='payment-amount']`).val()).to.equal('')
    )
  })

  describe('if returning here to change fields', () => {
    describe('where an amount was set', () => {
      let $, session
      before(done => {
        const user = getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'tokens:create' }]
        })
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
          payment_provider: 'sandbox'
        })
        session = getMockSession(user)
        lodash.set(session, 'pageData.createPaymentLink', {
          paymentLinkTitle: 'Pay for an offline service',
          paymentLinkDescription: 'Hello world',
          paymentAmountType: 'fixed',
          paymentLinkAmount: '500'
        })
        supertest(createAppWithSession(getApp(), session))
          .get(paths.paymentLinks.amount)
          .end((err, res) => {
            $ = cheerio.load(res.text)
            done(err)
          })
      })
      after(() => {
        nock.cleanAll()
      })

      it(`should set the fixed amount radio to checked`, () =>
        expect($(`#amount-type-fixed:checked`).length).to.equal(1)
      )

      it(`should set the value of the amount input to pre-existing data present in the session`, () =>
        expect($(`input[name='payment-amount']`).val()).to.equal(penceToPounds(session.pageData.createPaymentLink.paymentLinkAmount))
      )
    })

    describe('where an amount was not set', () => {
      let $, session
      before(done => {
        const user = getUser({
          gateway_account_ids: [GATEWAY_ACCOUNT_ID],
          permissions: [{ name: 'tokens:create' }]
        })
        nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, {
          payment_provider: 'sandbox'
        })
        session = getMockSession(user)
        lodash.set(session, 'pageData.createPaymentLink', {
          paymentLinkTitle: 'Pay for an offline service',
          paymentLinkDescription: 'Hello world',
          paymentAmountType: 'variable',
          paymentLinkAmount: ''
        })
        supertest(createAppWithSession(getApp(), session))
          .get(paths.paymentLinks.amount)
          .end((err, res) => {
            $ = cheerio.load(res.text)
            done(err)
          })
      })
      after(() => {
        nock.cleanAll()
      })

      it(`should set the variable amount radio to checked`, () =>
        expect($(`#amount-type-variable:checked`).length).to.equal(1)
      )

      it(`should set the value of the amount input to pre-existing data present in the session`, () =>
        expect($(`input[name='payment-amount']`).val()).to.equal('')
      )
    })
  })
})
