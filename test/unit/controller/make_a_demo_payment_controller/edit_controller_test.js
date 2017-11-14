'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const cheerio = require('cheerio')
const lodash = require('lodash')
const nock = require('nock')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')

const GATEWAY_ACCOUNT_ID = 929
const {CONNECTOR_URL} = process.env
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{name: 'transactions:read'}]
})
const VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE = {
  payment_provider: 'sandbox'
}

describe('make a demo payment - edit controller', () => {
  describe(`when the path navigated to is the 'edit amount' path`, () => {
    let result, $, session, paymentAmount
    before(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      paymentAmount = '100.00'
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentAmount', paymentAmount)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.prototyping.demoPayment.editAmount)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return with a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it('should render the edit amount page', () => {
      expect($('h1').text()).to.equal('Edit payment amount')
    })

    it('should have a back button that takes the user back to the demo payment index page', () => {
      expect($('.link-back').attr('href')).to.equal(paths.prototyping.demoPayment.index)
    })

    it(`should set the 'payment-amount' value to be that found in the session`, () => {
      expect($(`input[name='payment-amount']`).val()).to.equal(paymentAmount)
    })
  })
  describe(`when the path navigated to is the 'edit description' path`, () => {
    let result, $, session, paymentDescription
    before(done => {
      nock(CONNECTOR_URL).get(`/v1/frontend/accounts/${GATEWAY_ACCOUNT_ID}`).reply(200, VALID_MINIMAL_GATEWAY_ACCOUNT_RESPONSE)
      paymentDescription = 'Pay your window tax'
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.makeADemoPayment.paymentDescription', paymentDescription)
      supertest(createAppWithSession(getApp(), session))
        .get(paths.prototyping.demoPayment.editDescription)
        .end((err, res) => {
          result = res
          $ = cheerio.load(res.text)
          done(err)
        })
    })

    after(() => {
      nock.cleanAll()
    })

    it('should return with a statusCode of 200', () => {
      expect(result.statusCode).to.equal(200)
    })

    it('should render the edit amount page', () => {
      expect($('h1').text()).to.equal('Edit payment description')
    })

    it('should have a back button that takes the user back to the demo payment index page', () => {
      expect($('.link-back').attr('href')).to.equal(paths.prototyping.demoPayment.index)
    })

    it(`should set the 'payment-description' value to be that found in the session`, () => {
      expect($(`textarea[name='payment-description']`).val()).to.equal(paymentDescription)
    })
  })
})
