'use strict'

// NPM dependencies
const supertest = require('supertest')
const {expect} = require('chai')
const lodash = require('lodash')
const csrf = require('csrf')

// Local dependencies
const {getApp} = require('../../../../server')
const {getMockSession, createAppWithSession, getUser} = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')

const GATEWAY_ACCOUNT_ID = '929'
const PAYMENT_TITLE = 'Payment title'
const PAYMENT_DESCRIPTION = 'Payment description'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'payment-link-title': PAYMENT_TITLE,
  'payment-link-description': PAYMENT_DESCRIPTION
}
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{name: 'transactions:read'}]
})

describe.only('Create payment link information controller', () => {
  describe(`when both paymentLinkTitle and paymentLinkDescription are submitted`, () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.information)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have paymentLinkTitle and paymentLinkDescription stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkTitle').to.equal(PAYMENT_TITLE)
      expect(sessionPageData).to.have.property('paymentLinkDescription').to.equal(PAYMENT_DESCRIPTION)
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the review page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
    })
    
  })
  describe(`when no paymentLinkDescription is submitted`, () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.information)
        .send(Object.assign({}, VALID_PAYLOAD, {'payment-link-description': ''}))
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have paymentLinkTitle stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkTitle').to.equal(PAYMENT_TITLE)
    })

    it('should have no paymentLinkDescription stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkDescription').to.equal('')
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the review page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
    })
  })
  describe(`when no paymentLinkTitle is submitted`, () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.information)
        .send(Object.assign({}, VALID_PAYLOAD, {'payment-link-title': ''}))
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have no paymentLinkTitle stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkTitle').to.equal('')
    })

    it('should have paymentLinkDescription stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkDescription').to.equal(PAYMENT_DESCRIPTION)
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the information page with an error message', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.information)
    })

    it('should add a relevant error message to the session \'flash\'', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#payment-link-title">Title</a></li></ul>')
    })
  })
})
