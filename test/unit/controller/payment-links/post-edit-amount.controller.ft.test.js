'use strict'

const supertest = require('supertest')
const { expect } = require('chai')
const nock = require('nock')
const csrf = require('csrf')

const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')
const formattedPathFor = require('../../../../app/utils/replace-params-in-path')

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
      session.editPaymentLinkData = { externalId: PRODUCT_EXTERNAL_ID }
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
      session.editPaymentLinkData = { externalId: PRODUCT_EXTERNAL_ID }
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
      session.editPaymentLinkData = { externalId: PRODUCT_EXTERNAL_ID }
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

    it('should have a recovered object stored on the session containing errors and submitted data', () => {
      const recovered = session.editPaymentLinkData.amountPageRecovered
      expect(recovered).to.have.property('type').to.equal('')
      expect(recovered).to.have.property('amount').to.equal('')
      expect(recovered).to.have.property('errors')
      expect(recovered.errors).to.have.property('type')
    })
  })

  describe('if no price set', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      session.editPaymentLinkData = { externalId: PRODUCT_EXTERNAL_ID }
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

    it('should have a recovered object stored on the session containing errors and submitted data', () => {
      const recovered = session.editPaymentLinkData.amountPageRecovered
      expect(recovered).to.have.property('type').to.equal('fixed')
      expect(recovered).to.have.property('amount').to.equal('')
      expect(recovered).to.have.property('errors')
      expect(recovered.errors).to.have.property('amount')
    })
  })
})
