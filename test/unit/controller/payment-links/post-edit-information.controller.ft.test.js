'use strict'

// NPM dependencies
const supertest = require('supertest')
const { expect } = require('chai')
const nock = require('nock')
const csrf = require('csrf')

// Local dependencies
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

describe('POST payment link edit information controller', () => {
  describe('if values are present', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'payment-link-title': 'hello world',
          'payment-link-description': 'some words'
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

    it('should set title in session', () => {
      expect(session.editPaymentLinkData.name).to.equal('hello world')
    })

    it('should set details in session', () => {
      expect(session.editPaymentLinkData.description).to.equal('some words')
    })

    it('should redirect to the edit page', () => {
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.edit, PRODUCT_EXTERNAL_ID))
    })
  })
  describe('if title is blank', () => {
    let result, session, app
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
        .send({
          csrfToken: csrf().create('123'),
          'payment-link-title': '',
          'payment-link-description': 'some words'
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
      expect(result.headers).to.have.property('location').to.equal(formattedPathFor(paths.paymentLinks.editInformation, PRODUCT_EXTERNAL_ID))
    })

    it('should redirect with error message', () => {
      expect(session.flash).to.have.property('error')
      expect(session.flash.error.length).to.equal(1)
      expect(session.flash.error[0]).to.equal('Enter a title')
    })
  })
})
