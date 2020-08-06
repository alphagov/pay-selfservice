'use strict'

// NPM dependencies
const supertest = require('supertest')
const { expect } = require('chai')
const lodash = require('lodash')
const csrf = require('csrf')

// Local dependencies
const { getApp } = require('../../../../server')
const { getMockSession, createAppWithSession, getUser } = require('../../../test-helpers/mock-session')
const paths = require('../../../../app/paths')

const GATEWAY_ACCOUNT_ID = '929'
const VALID_USER = getUser({
  gateway_account_ids: [GATEWAY_ACCOUNT_ID],
  permissions: [{ name: 'tokens:create' }]
})

describe('Create payment link reference post controller', () => {
  describe(`when a custom reference is submitted`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'reference-type-group': 'custom',
      'reference-label': 'Some words',
      'reference-hint-text': 'Some more words'
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.reference)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have paymentReferenceType stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentReferenceType').to.equal(VALID_PAYLOAD['reference-type-group'])
    })

    it('should have paymentReferenceLabel stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentReferenceLabel').to.equal(VALID_PAYLOAD['reference-label'])
    })

    it('should have paymentReferenceHint stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentReferenceHint').to.equal(VALID_PAYLOAD['reference-hint-text'])
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the amount page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.amount)
    })
  })

  describe(`when no payment reference is entered and standard reference is selected`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'reference-type-group': 'standard',
      'reference-label': '',
      'reference-hint-text': ''
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.reference)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should have paymentReferenceType stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentReferenceType').to.equal(VALID_PAYLOAD['reference-type-group'])
    })

    it('should have paymentReferenceLabel stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentReferenceLabel').to.equal(VALID_PAYLOAD['reference-label'])
    })

    it('should have paymentReferenceHint stored in the session', () => {
      const sessionPageData = lodash.get(session, 'pageData.createPaymentLink', {})
      expect(sessionPageData).to.have.property('paymentReferenceHint').to.equal(VALID_PAYLOAD['reference-hint-text'])
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect to the amount page', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.amount)
    })
  })

  describe(`when neither radio button is chosen`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'reference-type-group': '',
      'reference-label': '',
      'reference-hint-text': ''
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.reference)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should pass an error with "paymentReferenceType"', () => {
      expect(session.flash.errorType[0]).to.equal('paymentReferenceType')
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to itself', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.reference)
    })
  })

  describe(`when custom reference radio button is chosen but no label is supplied`, () => {
    let result, session, app
    const VALID_PAYLOAD = {
      'csrfToken': csrf().create('123'),
      'reference-type-group': 'custom',
      'reference-label': '',
      'reference-hint-text': ''
    }
    before('Arrange', () => {
      session = getMockSession(VALID_USER)
      app = createAppWithSession(getApp(), session)
    })
    before('Act', done => {
      supertest(app)
        .post(paths.paymentLinks.reference)
        .send(VALID_PAYLOAD)
        .end((err, res) => {
          result = res
          done(err)
        })
    })

    it('should pass an error with "label"', () => {
      expect(session.flash.errorType[0]).to.equal('label')
    })

    it('should redirect with status code 302', () => {
      expect(result.statusCode).to.equal(302)
    })

    it('should redirect back to itself', () => {
      expect(result.headers).to.have.property('location').to.equal(paths.paymentLinks.reference)
    })
  })
})
