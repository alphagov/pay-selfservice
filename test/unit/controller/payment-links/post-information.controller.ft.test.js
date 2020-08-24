'use strict'

// NPM dependencies
const supertest = require('supertest')
const { expect } = require('chai')
const lodash = require('lodash')
const nock = require('nock')
const csrf = require('csrf')

// Local dependencies
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const { validProductResponse } = require('../../../fixtures/product.fixtures')

const { PRODUCTS_URL } = process.env
let product
const GATEWAY_ACCOUNT_ID = '929'
const SERVICE_NAME = 'Pay for an offline service'
const SERVICE_NAME_SLUGIFIED = 'pay-for-offline-service'
const PAYMENT_TITLE = 'Payment title'
const PAYMENT_TITLE_SLUGIFIED = 'payment-title'
const PAYMENT_DESCRIPTION = 'Payment description'
const VALID_PAYLOAD = {
  'csrfToken': csrf().create('123'),
  'payment-link-title': PAYMENT_TITLE,
  'service-name-path': SERVICE_NAME,
  'payment-link-description': PAYMENT_DESCRIPTION
}
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})

describe('Create payment link information controller', () => {
  describe(`when both paymentLinkTitle and paymentLinkDescription are submitted`, () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
      product = validProductResponse({
        type: 'ADHOC',
        service_name_path: SERVICE_NAME_SLUGIFIED,
        product_name_path: PAYMENT_TITLE_SLUGIFIED
      }).getPlain()
    })

    describe(`and URL isnt taken already`, () => {
      before('Arrange', () => {
        nock(PRODUCTS_URL)
          .get(`/v1/api/products`)
          .query({ 'serviceNamePath': product.service_name_path, 'productNamePath': product.product_name_path })
          .reply(404, product)
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

      it('should have serviceNamePath and productNamePath stored in the session', () => {
        const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
        expect(sessionPageData).to.have.property('serviceNamePath').to.equal(SERVICE_NAME_SLUGIFIED)
        expect(sessionPageData).to.have.property('productNamePath').to.equal(PAYMENT_TITLE_SLUGIFIED)
      })

      it('should redirect with status code 302', () => {
        expect(result.statusCode).to.equal(302)
      })

      it('should redirect to the amount page', () => {
        expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.reference)
      })
    })

    describe(`and URL is taken already`, () => {
      before('Arrange', () => {
        nock(PRODUCTS_URL)
          .get(`/v1/api/products`)
          .query({ 'serviceNamePath': product.service_name_path, 'productNamePath': product.product_name_path })
          .reply(200, product)
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

      it('should have serviceNamePath and productNamePath stored in the session', () => {
        const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
        expect(sessionPageData).to.have.property('serviceNamePath').to.equal(SERVICE_NAME_SLUGIFIED)
        expect(sessionPageData).to.have.property('productNamePath').to.equal(PAYMENT_TITLE_SLUGIFIED)
      })

      it('should redirect with status code 302', () => {
        expect(result.statusCode).to.equal(302)
      })

      it('should redirect to the web address page', () => {
        expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.webAddress)
      })
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
        .send(Object.assign({}, VALID_PAYLOAD, { 'payment-link-description': '' }))
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

    it('should have serviceNamePath and productNamePath stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('serviceNamePath').to.equal(SERVICE_NAME_SLUGIFIED)
      expect(sessionPageData).to.have.property('productNamePath').to.equal(PAYMENT_TITLE_SLUGIFIED)
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the amount page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.reference)
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
        .send(Object.assign({}, VALID_PAYLOAD, { 'payment-link-title': '' }))
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
      expect(session.flash).to.have.property('error')
      expect(session.flash.error.length).to.equal(1)
      expect(session.flash.error[0]).to.equal('Enter a title')
    })
  })
})
