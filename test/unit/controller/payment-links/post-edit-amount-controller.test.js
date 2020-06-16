'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test_helpers/mock_session')
const paths = require('../../../../app/paths')
const formattedPathFor = require('../../../../app/utils/replace_params_in_path')

const GATEWAY_ACCOUNT_ID = '929'
const PRODUCT_EXTERNAL_ID = '2903e4yohi0we9yho2hio'

const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})

describe('POST payment link edit amount controller', () => {
  describe('if fixed price is set', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'amount-type-group': 'fixed',
          'payment-amount': '5.00'
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to edit page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })

    it('should set price in session', () => {
      expect(session.editPaymentLinkData.price).to.equal(500)
    })

    it('should redirect to the edit page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })
  })

  describe('if variable price is set', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'amount-type-group': 'variable',
          'payment-amount': '5.00'
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to edit page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })

    it('should set price in session', () => {
      expect(session.editPaymentLinkData.price).to.equal('')
    })

    it('should redirect to the edit page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })
  })

  describe('if no radio is selected', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'amount-type-group': ''
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to same page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID))
    })

    it('should redirect with error message', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#fixed-or-variable">Is the payment for a fixed amount?</a></li></ul>')
    })
  })

  describe('if no price set is bad', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'amount-type-group': 'fixed',
          'payment-amount': 'djhd'
        })
        .end((err, res) => {
          result = res
          done(err)
        })
    })
    after(() => {
      nock.cleanAll()
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to same page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.editAmount, PRODUCT_EXTERNAL_ID))
    })

    it('should redirect with error message', () => {
      expect(session.flash).to.have.property('genericError')
      expect(session.flash.genericError.length).to.equal(1)
      expect(session.flash.genericError[0]).to.equal('<h2>There was a problem with the details you gave for:</h2><ul class="error-summary-list"><li><a href="#payment-amount">Enter the amount</a></li></ul>')
    })
  })
})
