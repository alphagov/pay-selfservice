'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const lodash = require('lodash')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { safeConvertPoundsStringToPence } = require('../../../../app/utils/currency-formatter')

const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})

describe('Create payment link amount post controller', () => {
  describe(`when a fixed amount is submitted`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'amount-type-group': 'fixed',
      'payment-amount': '5.00'
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {})
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.amount)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have paymentLinkAmount stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkAmount').to.equal(safeConvertPoundsStringToPence(VALID_PAYLOAD['payment-amount']))
    })

    it('should have paymentAmountType stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentAmountType').to.equal(VALID_PAYLOAD['amount-type-group'])
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the review page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
    })
  })

  describe(`when no payment amount is entered and variable amount is selected`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'payment-amount': '',
      'amount-type-group': 'variable'
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {})
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.amount)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have no paymentLinkAmount stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkAmount').to.equal('')
    })

    it('should have paymentAmountType stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentAmountType').to.equal(VALID_PAYLOAD['amount-type-group'])
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the review page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
    })
  })

  describe(`when a payment amount is submitted but variable is selected`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'payment-amount': '5.00',
      'amount-type-group': 'variable'
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {})
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.amount)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have no paymentLinkAmount stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentLinkAmount').to.equal('')
    })

    it('should have paymentAmountType stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentAmountType').to.equal(VALID_PAYLOAD['amount-type-group'])
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the review page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.review)
    })
  })

  describe(`when neither radio button is chosen`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'payment-amount': ''
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      lodash.set(session, 'pageData.createPaymentLink', {})
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.amount)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have a recovered object stored on the session containing error', () => {
      const recovered = lodash.get(session, 'pageData.createPaymentLink.amountPageRecovered', {})
      expect(recovered.errors).to.have.property('type')
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to itself', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.amount)
    })
  })
})
